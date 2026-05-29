-- Profiles, household mode, and trust/account controls
-- Run in Supabase SQL Editor after prior migrations.

-- ---------------------------------------------------------------------------
-- health_profiles: separate health data subjects under one login
-- Primary profile id matches auth.users.id so existing rows stay valid.
-- ---------------------------------------------------------------------------
create table if not exists public.health_profiles (
  id uuid primary key default gen_random_uuid(),
  account_owner_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null,
  profile_type text not null default 'self'
    check (profile_type in ('self', 'managed')),
  relationship text,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists health_profiles_owner_idx
  on public.health_profiles (account_owner_id);

-- ---------------------------------------------------------------------------
-- account_settings: solo vs household (paid tier foundation)
-- ---------------------------------------------------------------------------
create table if not exists public.account_settings (
  account_owner_id uuid primary key references auth.users(id) on delete cascade,
  plan text not null default 'solo' check (plan in ('solo', 'household')),
  max_profiles integer not null default 1,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Backfill primary profiles from existing health data
-- ---------------------------------------------------------------------------
insert into public.health_profiles (id, account_owner_id, display_name, profile_type, is_primary)
select distinct user_id, user_id, 'Me', 'self', true
from (
  select user_id from public.daily_logs
  union select user_id from public.food_entries
  union select user_id from public.lab_values
  union select user_id from public.workouts
  union select user_id from public.supplements
  union select user_id from public.medications
  union select user_id from public.blood_pressure_readings
  union select user_id from public.medication_items
  union select user_id from public.medication_checkins
  union select user_id from public.weekly_checkins
) existing
on conflict (id) do nothing;

insert into public.account_settings (account_owner_id)
select id from auth.users
on conflict (account_owner_id) do nothing;

-- ---------------------------------------------------------------------------
-- Repoint user_id FKs from auth.users -> health_profiles
-- ---------------------------------------------------------------------------
do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'daily_logs', 'food_entries', 'lab_values', 'workouts', 'supplements',
    'medications', 'blood_pressure_readings', 'medication_items',
    'medication_checkins', 'weekly_checkins'
  ] loop
    execute format(
      'alter table public.%I drop constraint if exists %I_user_id_fkey',
      tbl, tbl
    );
    execute format(
      'alter table public.%I add constraint %I_user_id_fkey
         foreign key (user_id) references public.health_profiles(id) on delete cascade',
      tbl, tbl
    );
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- RLS helper: account owner may access any of their profiles' data
-- ---------------------------------------------------------------------------
create or replace function public.owns_profile(profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.health_profiles hp
    where hp.id = profile_id
      and hp.account_owner_id = auth.uid()
  );
$$;

grant execute on function public.owns_profile(uuid) to authenticated;

-- health_profiles policies
alter table public.health_profiles enable row level security;

drop policy if exists "Owners manage health_profiles" on public.health_profiles;
create policy "Owners manage health_profiles"
  on public.health_profiles for all
  using (account_owner_id = auth.uid())
  with check (account_owner_id = auth.uid());

-- account_settings policies
alter table public.account_settings enable row level security;

drop policy if exists "Owners manage account_settings" on public.account_settings;
create policy "Owners manage account_settings"
  on public.account_settings for all
  using (account_owner_id = auth.uid())
  with check (account_owner_id = auth.uid());

-- Replace per-table policies to use owns_profile(user_id)
do $$
declare
  tbl text;
  pol text;
begin
  foreach tbl in array array[
    'daily_logs', 'food_entries', 'lab_values', 'workouts', 'supplements',
    'medications', 'blood_pressure_readings', 'medication_items',
    'medication_checkins', 'weekly_checkins'
  ] loop
    for pol in
      select policyname from pg_policies
      where schemaname = 'public' and tablename = tbl
    loop
      execute format('drop policy if exists %I on public.%I', pol, tbl);
    end loop;

    execute format(
      'create policy "Owners select %1$s" on public.%1$s for select using (public.owns_profile(user_id))',
      tbl
    );
    execute format(
      'create policy "Owners insert %1$s" on public.%1$s for insert with check (public.owns_profile(user_id))',
      tbl
    );
    execute format(
      'create policy "Owners update %1$s" on public.%1$s for update using (public.owns_profile(user_id))',
      tbl
    );
    execute format(
      'create policy "Owners delete %1$s" on public.%1$s for delete using (public.owns_profile(user_id))',
      tbl
    );
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- RPCs
-- ---------------------------------------------------------------------------
create or replace function public.ensure_user_profile()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  pid uuid;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  select id into pid
  from public.health_profiles
  where account_owner_id = uid and is_primary
  limit 1;

  if pid is null then
    insert into public.health_profiles (id, account_owner_id, display_name, profile_type, is_primary)
    values (uid, uid, 'Me', 'self', true)
    returning id into pid;
  end if;

  insert into public.account_settings (account_owner_id)
  values (uid)
  on conflict (account_owner_id) do nothing;

  return pid;
end;
$$;

grant execute on function public.ensure_user_profile() to authenticated;

create or replace function public.upgrade_to_household()
returns public.account_settings
language plpgsql
security definer
set search_path = public
as $$
declare
  result public.account_settings;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  update public.account_settings
  set plan = 'household', max_profiles = 4, updated_at = now()
  where account_owner_id = auth.uid()
  returning * into result;

  if result is null then
    insert into public.account_settings (account_owner_id, plan, max_profiles)
    values (auth.uid(), 'household', 4)
    returning * into result;
  end if;

  return result;
end;
$$;

grant execute on function public.upgrade_to_household() to authenticated;

create or replace function public.create_managed_profile(
  p_display_name text,
  p_relationship text default null
)
returns public.health_profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  max_p integer;
  current_count integer;
  result public.health_profiles;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select max_profiles into max_p
  from public.account_settings
  where account_owner_id = auth.uid();

  if max_p is null then
    max_p := 1;
  end if;

  select count(*) into current_count
  from public.health_profiles
  where account_owner_id = auth.uid();

  if current_count >= max_p then
    raise exception 'Profile limit reached. Upgrade to Household for more profiles.';
  end if;

  insert into public.health_profiles (
    account_owner_id, display_name, profile_type, relationship, is_primary
  )
  values (auth.uid(), trim(p_display_name), 'managed', p_relationship, false)
  returning * into result;

  return result;
end;
$$;

grant execute on function public.create_managed_profile(text, text) to authenticated;

create or replace function public.delete_managed_profile(p_profile_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  delete from public.health_profiles
  where id = p_profile_id
    and account_owner_id = auth.uid()
    and is_primary = false;
end;
$$;

grant execute on function public.delete_managed_profile(uuid) to authenticated;

create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  delete from auth.users where id = auth.uid();
end;
$$;

grant execute on function public.delete_own_account() to authenticated;
