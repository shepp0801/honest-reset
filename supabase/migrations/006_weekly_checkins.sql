-- Run in Supabase SQL Editor after prior migrations

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

create index if not exists weekly_checkins_user_week_idx
  on public.weekly_checkins (user_id, week_start desc);

alter table public.weekly_checkins enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'Users can view own weekly_checkins') then
    create policy "Users can view own weekly_checkins"
      on public.weekly_checkins for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Users can insert own weekly_checkins') then
    create policy "Users can insert own weekly_checkins"
      on public.weekly_checkins for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Users can update own weekly_checkins') then
    create policy "Users can update own weekly_checkins"
      on public.weekly_checkins for update using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Users can delete own weekly_checkins') then
    create policy "Users can delete own weekly_checkins"
      on public.weekly_checkins for delete using (auth.uid() = user_id);
  end if;
end $$;
