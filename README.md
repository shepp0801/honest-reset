# Health & Wellness Tracker

Personal health tracking app built with React, Vite, Tailwind CSS, and Supabase.

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Supabase**

   - Create a project at [supabase.com](https://supabase.com)
   - Run `supabase/schema.sql` in the SQL Editor
   - Enable Email auth under Authentication ? Providers

3. **Environment**

   ```bash
   cp .env.example .env
   ```

   Add your `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

4. **Run**

   ```bash
   npm run dev
   ```

## Pages

- **Dashboard** � today's summary + 30-day trend charts
- **Daily Planner** � metrics, food, workouts, supplements, medications
- **Lab Values** � lab results + A1C chart
- **History** � expandable past daily logs
