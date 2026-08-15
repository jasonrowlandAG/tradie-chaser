# TradieChaser

Automated SMS + email invoice reminders for Australian solo tradies.

**MVP built for 24–48 hour launch.**

## What it does

1. Tradie signs up and adds an unpaid invoice (client name, phone, email, amount, due date).
2. System automatically schedules a sequence of SMS + email reminders (Day 0, 3, 7, 14).
3. A cron job sends the reminders every hour.
4. When the tradie marks the invoice as paid, all future reminders are cancelled automatically.

## Tech Stack

- Next.js 15 (App Router) + TypeScript
- Supabase (Auth + Postgres + RLS)
- Twilio (SMS)
- Resend (Email)
- Vercel (Hosting + Cron)

## Setup (minimum manual steps)

### 1. Supabase (5 minutes)

1. Create a free project at https://supabase.com
2. Go to **SQL Editor** → New query → paste the entire contents of `supabase/schema.sql` → Run
3. Go to **Project Settings → API** and copy:
   - Project URL
   - `anon` `public` key
   - `service_role` key (secret)

### 2. Twilio (for SMS)

1. Sign up / log in at https://www.twilio.com
2. Buy or use a number that can SMS Australian mobiles
3. Copy Account SID, Auth Token, and the From number

### 3. Resend (for Email)

1. Sign up at https://resend.com
2. Create an API key
3. (Optional but recommended) Add and verify your domain

### 4. Environment Variables

Copy `.env.example` to `.env.local` (local) and also add the same values in the Vercel dashboard.

### 5. Deploy (almost zero friction)

1. Go to https://vercel.com/new
2. Import the GitHub repo `jasonrowlandAG/tradie-chaser`
3. Add all environment variables from `.env.example`
4. Deploy

The hourly cron job is already defined in `vercel.json`.

### Local development

```bash
npm install
npm run dev
```

## Features included in this MVP

- Email + password auth
- Add invoice + automatic reminder scheduling
- Dashboard with outstanding total and list
- One-click "Mark paid" (cancels future reminders)
- Settings page (business name, phone, bank details)
- SMS + Email sequences with natural Australian tradie tone
- Protected cron endpoint

## Next steps after launch

- Stripe billing for the SaaS itself ($19–29/mo founding price)
- CSV import
- Xero / ServiceM8 light integration
- Simple analytics
