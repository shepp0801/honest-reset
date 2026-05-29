-- Run in Supabase SQL Editor if you already created tables from schema.sql

create table if not exists public.medication_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item_type text not null check (item_type in ('Medication', 'Supplement')),
  name text not null,
  dosage text,
  schedule_label text not null default 'Daily',
  scheduled_time time,
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.medication_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item_id uuid not null references public.medication_items(id) on delete cascade,
  taken_date date not null,
  taken_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (user_id, item_id, taken_date)
);

create index if not exists medication_items_user_active_idx
  on public.medication_items (user_id, active, scheduled_time);

create index if not exists medication_checkins_user_date_idx
  on public.medication_checkins (user_id, taken_date desc);

alter table public.medication_items enable row level security;
alter table public.medication_checkins enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'Users can view own medication_items') then
    create policy "Users can view own medication_items"
      on public.medication_items for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Users can insert own medication_items') then
    create policy "Users can insert own medication_items"
      on public.medication_items for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Users can update own medication_items') then
    create policy "Users can update own medication_items"
      on public.medication_items for update using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Users can delete own medication_items') then
    create policy "Users can delete own medication_items"
      on public.medication_items for delete using (auth.uid() = user_id);
  end if;

  if not exists (select 1 from pg_policies where policyname = 'Users can view own medication_checkins') then
    create policy "Users can view own medication_checkins"
      on public.medication_checkins for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Users can insert own medication_checkins') then
    create policy "Users can insert own medication_checkins"
      on public.medication_checkins for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Users can update own medication_checkins') then
    create policy "Users can update own medication_checkins"
      on public.medication_checkins for update using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Users can delete own medication_checkins') then
    create policy "Users can delete own medication_checkins"
      on public.medication_checkins for delete using (auth.uid() = user_id);
  end if;
end $$;
