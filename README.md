# The Honest Reset

Personal health tracker for women 40+ / perimenopause — honest daily logging, weekly check-ins, labs, meds, and a provider-ready PDF. Built with React, Vite, Tailwind CSS, and Supabase.

---

## Project context (for developers & AI assistants)

**Status:** Beta live on Vercel. Free testers; paid Stripe launch planned (not built yet).

**Stack**

| Layer | Tool |
|-------|------|
| Frontend | React + Vite + Tailwind |
| Auth & DB | Supabase (email/password, RLS) |
| Hosting | Vercel (`vercel.json` rewrites for client routing) |
| Repo | `github.com/shepp0801/honest-reset` |

**Env vars** (local `.env`, Vercel dashboard — never commit `.env`):

- `VITE_SUPABASE_URL` — Project URL from Supabase
- `VITE_SUPABASE_ANON_KEY` — Publishable / anon key

**Supabase migrations** (run in SQL Editor, in order):

1. `supabase/schema.sql` — base schema (new projects)
2. `002_blood_pressure.sql` through `008_account_profile_fields.sql`

**Key features shipped**

- Daily Log, Dashboard, Weekly Check-in, Labs, Meds, Goals
- Privacy & Trust page — full JSON export, account delete, household mode (beta)
- **Settings** — first/last name, gender, age, marketing opt-in → `account_settings`
- **Household mode** — separate `health_profiles` per person under one login; profile switcher in header
- Provider visit PDF (jspdf), sage/terracotta branding

**Data model notes**

- Health rows use `user_id` → `health_profiles.id` (after migration 007)
- Account holder email lives in `auth.users`; demographics in `account_settings`
- Goals (water/macros) still in localStorage, scoped per profile ID

**Roadmap (not implemented)**

- Stripe subscriptions (Solo / Household) with webhooks → auto-unlock plans
- PWA install (Dock / taskbar)
- Marketing landing page on separate site
- Legal: Privacy Policy + Terms + medical disclaimer before paid launch
- Vercel Pro when charging (~$20/mo; Hobby = non-commercial only)

**Deploy changes**

```bash
cd ~/health-wellness-tracker
git add .
git commit -m "Describe your change"
git push
```

Vercel redeploys automatically. Supabase SQL must be run manually in the SQL Editor.

**Demographics query** (Supabase SQL Editor):

```sql
select u.email, s.first_name, s.last_name, s.gender, s.age, s.marketing_opt_in, u.created_at
from auth.users u
left join public.account_settings s on s.account_owner_id = u.id
order by u.created_at desc;
```

---

## Local setup

1. `npm install`
2. Copy `.env.example` → `.env` and add Supabase credentials
3. Run migrations in Supabase (see list above)
4. `npm run dev`

## App pages

| Route | Page |
|-------|------|
| `/` | Daily Log |
| `/dashboard` | Dashboard |
| `/check-in` | Weekly honest check-in |
| `/labs` | Lab values |
| `/meds` | Medications & supplements |
| `/goals` | Water & macro goals |
| `/settings` | Profile & demographics |
| `/trust` | Privacy, export, household, delete account |

## Build

```bash
npm run build
```
