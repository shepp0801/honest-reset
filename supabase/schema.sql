-- Health & Wellness Tracker � run in Supabase SQL Editor

-- daily_logs: one row per day per user
create table if not exists public.daily_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  log_date date not null,
  weight_lbs numeric,
  steps integer,
  miles_walked numeric,
  water_oz numeric,
  notes text,
  blood_glucose numeric,
  systolic_bp integer,
  diastolic_bp integer,
  resting_heart_rate integer,
  bedtime time,
  wake_time time,
  sleep_hours numeric,
  sleep_quality integer,
  energy_level integer,
  mood integer,
  stress_level integer,
  created_at timestamptz not null default now(),
  unique (user_id, log_date)
);

-- food_entries: multiple per day
create table if not exists public.food_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  log_date date not null,
  meal_name text not null,
  calories numeric,
  protein_g numeric,
  carbs_g numeric,
  fat_g numeric,
  meal_type text,
  created_at timestamptz not null default now()
);

-- lab_values: occasional entries
create table if not exists public.lab_values (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  recorded_date date not null,
  test_name text not null,
  value numeric not null,
  unit text,
  notes text,
  created_at timestamptz not null default now()
);

-- workouts: multiple per day
create table if not exists public.workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  log_date date not null,
  exercise_name text not null,
  workout_type text default 'Other' check (workout_type in ('Cardio', 'Strength', 'Flexibility', 'Sports', 'Walking', 'Other')),
  duration_minutes integer,
  sets integer,
  reps integer,
  weight_lbs numeric,
  distance_miles numeric,
  heart_rate_avg integer,
  heart_rate_max integer,
  intensity text default 'Moderate' check (intensity in ('Low', 'Moderate', 'High')),
  notes text,
  created_at timestamptz not null default now()
);

-- supplements
create table if not exists public.supplements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  log_date date not null,
  name text not null,
  dosage text,
  time_taken time,
  created_at timestamptz not null default now()
);

-- blood_pressure_readings: multiple per day allowed
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

-- medications
create table if not exists public.medications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  log_date date not null,
  name text not null,
  dosage text,
  time_taken time,
  created_at timestamptz not null default now()
);

-- medication_items: recurring medication/supplement habits
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

-- medication_checkins: daily checklist completions
create table if not exists public.medication_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item_id uuid not null references public.medication_items(id) on delete cascade,
  taken_date date not null,
  taken_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (user_id, item_id, taken_date)
);

-- weekly_checkins: honest weekly reflection
create table if not exists public.weekly_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  week_start date not null,
  went_well text,
  was_hard text,
  focus_next_week text,
  provider_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, week_start)
);

-- indexes
create index if not exists daily_logs_user_date_idx on public.daily_logs (user_id, log_date desc);
create index if not exists food_entries_user_date_idx on public.food_entries (user_id, log_date desc);
create index if not exists lab_values_user_date_idx on public.lab_values (user_id, recorded_date desc);
create index if not exists workouts_user_date_idx on public.workouts (user_id, log_date desc);
create index if not exists supplements_user_date_idx on public.supplements (user_id, log_date desc);
create index if not exists medications_user_date_idx on public.medications (user_id, log_date desc);
create index if not exists blood_pressure_user_recorded_idx
  on public.blood_pressure_readings (user_id, recorded_at desc);
create index if not exists medication_items_user_active_idx
  on public.medication_items (user_id, active, scheduled_time);
create index if not exists medication_checkins_user_date_idx
  on public.medication_checkins (user_id, taken_date desc);
create index if not exists weekly_checkins_user_week_idx
  on public.weekly_checkins (user_id, week_start desc);

-- Row Level Security
alter table public.daily_logs enable row level security;
alter table public.food_entries enable row level security;
alter table public.lab_values enable row level security;
alter table public.workouts enable row level security;
alter table public.supplements enable row level security;
alter table public.medications enable row level security;
alter table public.blood_pressure_readings enable row level security;
alter table public.medication_items enable row level security;
alter table public.medication_checkins enable row level security;
alter table public.weekly_checkins enable row level security;

-- daily_logs policies
create policy "Users can view own daily_logs"
  on public.daily_logs for select using (auth.uid() = user_id);
create policy "Users can insert own daily_logs"
  on public.daily_logs for insert with check (auth.uid() = user_id);
create policy "Users can update own daily_logs"
  on public.daily_logs for update using (auth.uid() = user_id);
create policy "Users can delete own daily_logs"
  on public.daily_logs for delete using (auth.uid() = user_id);

-- food_entries policies
create policy "Users can view own food_entries"
  on public.food_entries for select using (auth.uid() = user_id);
create policy "Users can insert own food_entries"
  on public.food_entries for insert with check (auth.uid() = user_id);
create policy "Users can update own food_entries"
  on public.food_entries for update using (auth.uid() = user_id);
create policy "Users can delete own food_entries"
  on public.food_entries for delete using (auth.uid() = user_id);

-- lab_values policies
create policy "Users can view own lab_values"
  on public.lab_values for select using (auth.uid() = user_id);
create policy "Users can insert own lab_values"
  on public.lab_values for insert with check (auth.uid() = user_id);
create policy "Users can update own lab_values"
  on public.lab_values for update using (auth.uid() = user_id);
create policy "Users can delete own lab_values"
  on public.lab_values for delete using (auth.uid() = user_id);

-- workouts policies
create policy "Users can view own workouts"
  on public.workouts for select using (auth.uid() = user_id);
create policy "Users can insert own workouts"
  on public.workouts for insert with check (auth.uid() = user_id);
create policy "Users can update own workouts"
  on public.workouts for update using (auth.uid() = user_id);
create policy "Users can delete own workouts"
  on public.workouts for delete using (auth.uid() = user_id);

-- supplements policies
create policy "Users can view own supplements"
  on public.supplements for select using (auth.uid() = user_id);
create policy "Users can insert own supplements"
  on public.supplements for insert with check (auth.uid() = user_id);
create policy "Users can update own supplements"
  on public.supplements for update using (auth.uid() = user_id);
create policy "Users can delete own supplements"
  on public.supplements for delete using (auth.uid() = user_id);

-- medications policies
create policy "Users can view own medications"
  on public.medications for select using (auth.uid() = user_id);
create policy "Users can insert own medications"
  on public.medications for insert with check (auth.uid() = user_id);
create policy "Users can update own medications"
  on public.medications for update using (auth.uid() = user_id);
create policy "Users can delete own medications"
  on public.medications for delete using (auth.uid() = user_id);

-- blood_pressure_readings policies
create policy "Users can view own blood_pressure_readings"
  on public.blood_pressure_readings for select using (auth.uid() = user_id);
create policy "Users can insert own blood_pressure_readings"
  on public.blood_pressure_readings for insert with check (auth.uid() = user_id);
create policy "Users can update own blood_pressure_readings"
  on public.blood_pressure_readings for update using (auth.uid() = user_id);
create policy "Users can delete own blood_pressure_readings"
  on public.blood_pressure_readings for delete using (auth.uid() = user_id);

-- medication_items policies
create policy "Users can view own medication_items"
  on public.medication_items for select using (auth.uid() = user_id);
create policy "Users can insert own medication_items"
  on public.medication_items for insert with check (auth.uid() = user_id);
create policy "Users can update own medication_items"
  on public.medication_items for update using (auth.uid() = user_id);
create policy "Users can delete own medication_items"
  on public.medication_items for delete using (auth.uid() = user_id);

-- medication_checkins policies
create policy "Users can view own medication_checkins"
  on public.medication_checkins for select using (auth.uid() = user_id);
create policy "Users can insert own medication_checkins"
  on public.medication_checkins for insert with check (auth.uid() = user_id);
create policy "Users can update own medication_checkins"
  on public.medication_checkins for update using (auth.uid() = user_id);
create policy "Users can delete own medication_checkins"
  on public.medication_checkins for delete using (auth.uid() = user_id);

-- weekly_checkins policies
create policy "Users can view own weekly_checkins"
  on public.weekly_checkins for select using (auth.uid() = user_id);
create policy "Users can insert own weekly_checkins"
  on public.weekly_checkins for insert with check (auth.uid() = user_id);
create policy "Users can update own weekly_checkins"
  on public.weekly_checkins for update using (auth.uid() = user_id);
create policy "Users can delete own weekly_checkins"
  on public.weekly_checkins for delete using (auth.uid() = user_id);
