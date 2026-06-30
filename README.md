# RoundPayAjo

A Nigerian rotating savings (Ajo/Esusu) mobile app — **RoundPayAjo** helps verified groups save together, record every payment (cash or digital), and coordinate payouts. Built with Expo, Supabase, and Paystack.

## Features

- Email OTP authentication (Supabase Auth)
- Create and join Ajo groups with invite codes
- Rotation-based collection cycles (weekly or monthly)
- Paystack payments for contributions
- Paystack transfers for cycle payouts
- Push notifications for payments and due-date reminders
- Deep links: `roundpayajo://join/INVITE_CODE`

## Setup

### 1. Environment

```bash
cp .env.example .env
```

Fill in:

- `EXPO_PUBLIC_SUPABASE_URL` — from Supabase project settings
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` — anon/public key
- `EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY` — Paystack test public key

### 2. Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Run `supabase/migrations/001_schema.sql` in the SQL editor
3. Enable Email auth provider (OTP) in Authentication settings
4. Deploy Edge Functions and set secrets:
   - `PAYSTACK_SECRET_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`

```bash
npx supabase link --project-ref YOUR_REF
npx supabase functions deploy resolve-account
npx supabase functions deploy save-bank-account
npx supabase functions deploy create-contribution-payment
npx supabase functions deploy paystack-webhook
npx supabase functions deploy trigger-payout
npx supabase functions deploy send-reminders
```

5. Point Paystack webhook to: `https://YOUR_REF.supabase.co/functions/v1/paystack-webhook`
6. Schedule `send-reminders` daily via Supabase cron or external scheduler

### 3. Run the app

```bash
npm install
npx expo start
```

## Testing Paystack

- Test card: `4084084084084081`
- Use Paystack test keys in development

## Project structure

- `app/` — Expo Router screens
- `lib/` — Supabase, Paystack, groups logic
- `supabase/migrations/` — Database schema + RLS
- `supabase/functions/` — Edge Functions for payments
