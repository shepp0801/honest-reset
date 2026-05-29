-- Run in Supabase SQL Editor if you already created tables from schema.sql

create table if not exists public.blood_pressure_readings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  recorded_at timestamptz not null default now(),
  systolic integer not null,
  diastolic integer not null,
  pulse integer,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists blood_pressure_user_recorded_idx
  on public.blood_pressure_readings (user_id, recorded_at desc);

alter table public.blood_pressure_readings enable row level security;

create policy "Users can view own blood_pressure_readings"
  on public.blood_pressure_readings for select using (auth.uid() = user_id);
create policy "Users can insert own blood_pressure_readings"
  on public.blood_pressure_readings for insert with check (auth.uid() = user_id);
create policy "Users can update own blood_pressure_readings"
  on public.blood_pressure_readings for update using (auth.uid() = user_id);
create policy "Users can delete own blood_pressure_readings"
  on public.blood_pressure_readings for delete using (auth.uid() = user_id);
