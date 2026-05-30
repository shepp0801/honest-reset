-- Account holder profile & demographics (paired with auth email)
-- Run in Supabase SQL Editor after 007_profiles_trust_household.sql

alter table public.account_settings
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists gender text,
  add column if not exists age integer,
  add column if not exists marketing_opt_in boolean not null default false;

alter table public.account_settings
  drop constraint if exists account_settings_age_check;

alter table public.account_settings
  add constraint account_settings_age_check
  check (age is null or (age >= 18 and age <= 120));

alter table public.account_settings
  drop constraint if exists account_settings_gender_check;

alter table public.account_settings
  add constraint account_settings_gender_check
  check (
    gender is null
    or gender in (
      'Female',
      'Male',
      'Non-binary',
      'Prefer not to say',
      'Other'
    )
  );
