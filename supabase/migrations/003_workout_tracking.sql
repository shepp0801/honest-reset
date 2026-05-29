-- Run in Supabase SQL Editor if you already created tables from schema.sql

alter table public.workouts
  add column if not exists workout_type text default 'Other',
  add column if not exists sets integer,
  add column if not exists reps integer,
  add column if not exists weight_lbs numeric,
  add column if not exists distance_miles numeric,
  add column if not exists heart_rate_avg integer,
  add column if not exists heart_rate_max integer,
  add column if not exists intensity text default 'Moderate';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'workouts_workout_type_check'
  ) then
    alter table public.workouts
      add constraint workouts_workout_type_check
      check (workout_type in ('Cardio', 'Strength', 'Flexibility', 'Sports', 'Walking', 'Other'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'workouts_intensity_check'
  ) then
    alter table public.workouts
      add constraint workouts_intensity_check
      check (intensity in ('Low', 'Moderate', 'High'));
  end if;
end $$;

