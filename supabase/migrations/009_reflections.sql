-- Reflections journal (one entry per profile per day)
-- Run in Supabase SQL Editor after prior migrations.

create table if not exists public.reflections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.health_profiles(id) on delete cascade,
  reflection_date date not null,
  mood_tag text check (
    mood_tag is null
    or mood_tag in ('Great', 'Good', 'Okay', 'Rough', 'Really Hard')
  ),
  body text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, reflection_date)
);

create index if not exists reflections_user_date_idx
  on public.reflections (user_id, reflection_date desc);

alter table public.reflections enable row level security;

create policy "Owners select reflections"
  on public.reflections for select
  using (public.owns_profile(user_id));

create policy "Owners insert reflections"
  on public.reflections for insert
  with check (public.owns_profile(user_id));

create policy "Owners update reflections"
  on public.reflections for update
  using (public.owns_profile(user_id));

create policy "Owners delete reflections"
  on public.reflections for delete
  using (public.owns_profile(user_id));

-- Migrate legacy daily_logs.notes into reflections
insert into public.reflections (user_id, reflection_date, body, created_at, updated_at)
select user_id, log_date, trim(notes), created_at, created_at
from public.daily_logs
where notes is not null and trim(notes) <> ''
on conflict (user_id, reflection_date) do update
set
  body = case
    when reflections.body is null or trim(reflections.body) = '' then excluded.body
    else reflections.body
  end,
  updated_at = now();
