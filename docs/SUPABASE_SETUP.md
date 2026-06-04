# Supabase setup for Ajo Esusu

Follow these steps once. Takes about 10 minutes.

## Step 1 — Create a Supabase project

1. Open [https://supabase.com/dashboard](https://supabase.com/dashboard) and sign in (or create an account).
2. Click **New project**.
3. Fill in:
   - **Name:** `RoundPay` (or `ajo-esusu`)
   - **Database password:** choose a strong password and save it somewhere safe
   - **Region:** pick the closest to Nigeria (e.g. `eu-west-1` or `eu-central-1`)
4. Click **Create new project** and wait until status is **Active**.

## Step 2 — Copy API keys into `.env`

> **Expo note:** This app is **React Native (Expo)**, not Next.js. Do **not** install `@supabase/ssr` or add `middleware.ts` / `utils/supabase/server.ts` from the Next.js guide. Use `.env` with `EXPO_PUBLIC_*` variables only.

1. In the dashboard, go to **Project Settings** (gear) → **API**.
2. Copy:
   - **Project URL** → `EXPO_PUBLIC_SUPABASE_URL`
   - **anon public** or **publishable** key → `EXPO_PUBLIC_SUPABASE_ANON_KEY`
3. In the project folder, edit `.env`:

```env
EXPO_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_xxxxxxxx
```

4. Save the file.

## Step 3 — Enable email sign-in (OTP)

1. Go to **Authentication** → **Providers**.
2. Enable **Email**.
3. Under **Email**, turn off **Confirm email** for faster testing (optional).
4. Go to **Authentication** → **URL configuration**:
   - **Site URL:** `ajoesusu://` (production / dev build)
   - **Redirect URLs** — add **all** of these:
     - `ajoesusu://**`
     - `exp://**` (Expo Go on device)
     - `exp://127.0.0.1:8081/**` (iOS Simulator + Expo Go)
     - `exp://localhost:8081/**` (optional)

5. **Expo Go only:** After `npx expo start`, open the **Login** screen in the app. In development it shows the exact redirect URL (e.g. `exp://192.168.x.x:8081/--/auth/callback`). **Copy that line into Redirect URLs** in Supabase if email links open Safari and go nowhere.

6. Restart Expo after changing `.env`: `npx expo start --clear`

### Important: send a 6-digit code (not only a link)

By default Supabase emails a **magic link**, not a code. The app supports both, but for a visible code:

1. Go to **Authentication** → **Email Templates** → **Magic Link**.
2. Replace the body with something like:

```html
<h2>Your Ajo Esusu sign-in code</h2>
<p>Enter this code in the app: <strong>{{ .Token }}</strong></p>
<p>Or tap this link: {{ .ConfirmationURL }}</p>
```

3. Save the template. `{{ .Token }}` is required for a 6-digit OTP.

**No email at all?** Check **Authentication** → **Logs** for send errors. Check spam. Free tier may rate-limit (wait 60s between tries).

## Step 4 — Run the database migration

1. Open **SQL Editor** in the Supabase dashboard.
2. Click **New query**.
3. Open `supabase/migrations/001_schema.sql` in this repo, copy the **entire file**, paste into the editor.
4. Click **Run** (or Cmd+Enter).
5. Confirm success — you should see tables: `profiles`, `groups`, `group_members`, `cycles`, `contributions`, `payouts`.

## Step 5 — Verify tables

In **Table Editor**, check that `profiles` and `groups` exist.

## Step 6 — Restart the app

```bash
cd ~/Desktop/Projects/ajo-esusu
npx expo start --clear
```

You should land on **Login** (not Setup). Enter your email and receive an OTP.

## Optional — Edge Functions (for Paystack)

Needed only when you add Paystack keys.

1. Install CLI: `npm install`
2. Login: `npx supabase login`
3. Link project (ref is in dashboard URL: `https://supabase.com/dashboard/project/<PROJECT_REF>`):

```bash
npx supabase link --project-ref YOUR_PROJECT_REF
```

4. Set secrets in dashboard → **Edge Functions** → **Secrets**, or CLI:

```bash
npx supabase secrets set PAYSTACK_SECRET_KEY=sk_test_xxx
npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

(Service role key is under **Project Settings** → **API** — keep it secret.)

5. Deploy functions:

```bash
npm run supabase:deploy-functions
```

6. Paystack webhook URL:

```
https://YOUR_PROJECT_REF.supabase.co/functions/v1/paystack-webhook
```

## Troubleshooting

| Problem | Fix |
|--------|-----|
| App shows **Setup** screen | `.env` missing or still has `your-project` placeholder |
| OTP email not received | Check spam; confirm Email provider is on; use Supabase Auth logs |
| Email **link goes nowhere** | Add the `exp://…/auth/callback` URL from Login screen to Supabase redirect URLs; or use the **6-digit code** on Verify screen |
| **email rate limit exceeded** | Supabase default email is ~2–4/hour. **Stop tapping Resend.** Wait **1 hour**. Use an old code from inbox/spam. For real testing: **Authentication → SMTP** (custom provider) or sign in with your **Supabase team email** only |
| **Bank: Not authenticated** | You must **sign in** (not build mode). Deploy Edge Functions and set `PAYSTACK_SECRET_KEY` in Supabase secrets (see below) |
| `relation does not exist` | Re-run `001_schema.sql` in SQL Editor |
| Groups fail to create | Confirm you are logged in; check **Logs** → Postgres |

## Check env from terminal

```bash
npm run env:check
```
