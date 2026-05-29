-- Run in Supabase SQL Editor if you already created tables from schema.sql

alter table public.daily_logs
  add column if not exists blood_glucose numeric,
  add column if not exists systolic_bp integer,
  add column if not exists diastolic_bp integer,
  add column if not exists resting_heart_rate integer,
  add column if not exists bedtime time,
  add column if not exists wake_time time,
  add column if not exists sleep_hours numeric,
  add column if not exists sleep_quality integer,
  add column if not exists energy_level integer,
  add column if not exists mood integer,
  add column if not exists stress_level integer;

alter table public.food_entries
  add column if not exists meal_type text;

-- Optional: backfill meal_type from meal_name patterns is not reliable; leave null for old rows
