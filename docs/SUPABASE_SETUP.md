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

### Guest accounts (no email — for testing)

If sign-in email is rate-limited or not arriving:

1. **Authentication** → **Providers** → **Anonymous**
2. Turn **Anonymous sign-ins** **ON**
3. In the app (dev build): login → **Continue as guest (create groups)**, or Create group → **Guest account**

Guest users are real Supabase accounts and can create/join draft groups. They have no email until you add email sign-in later.

## Step 3b — Email provider details

1. Under **Email**, turn off **Confirm email** for faster testing (optional).
2. Go to **Authentication** → **URL configuration**:
   - **Site URL:** `ajoesusu://` (production / dev build)
   - **Redirect URLs** — add **all** of these:
     - `ajoesusu://**`
     - `exp://**` (Expo Go on device)
     - `exp://127.0.0.1:8081/**` (iOS Simulator + Expo Go)
     - `exp://localhost:8081/**` (optional)

3. **Expo Go only:** After `npx expo start`, open the **Login** screen in the app. In development it shows the exact redirect URL (e.g. `exp://192.168.x.x:8081/--/auth/callback`). **Copy that line into Redirect URLs** in Supabase if email links open Safari and go nowhere.

4. Restart Expo after changing `.env`: `npx expo start --clear`

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

### Step 4b — Profile + guest fix (required for Enter app)

If you see **Could not set up your profile**:

1. **SQL Editor** → **New query**
2. Copy all of `supabase/migrations/RUN_IN_SQL_EDITOR.sql` from this repo, paste, **Run**
3. Reload the app and tap **Enter app** again

## Step 5 — Verify tables

In **Table Editor**, check that `profiles` and `groups` exist.

## Step 6 — Restart the app

```bash
cd ~/Desktop/Projects/ajo-esusu
npx expo start --clear
```

You should land on **Login** (not Setup). Enter your email and receive an OTP.

## Step 6b — Google & Apple sign-in (optional)

1. **Authentication** → **Providers** → enable **Google** and/or **Apple**.
2. **Redirect URLs** (same as email): `ajoesusu://**`, `exp://**`, and your Expo Go callback URL.
3. **Google:** [Google Cloud Console](https://console.cloud.google.com/) → OAuth client → Web client ID + iOS client (bundle `com.roundpay.ajoesusu`) → paste into Supabase Google provider settings. Add redirect: `https://dolcajrcjhsfpyxzwtjk.supabase.co/auth/v1/callback` (your project URL).
4. **Apple:** [Apple Developer](https://developer.apple.com/) — see **Step 6c** below. Required for OAuth (Expo Go / browser flow). Native iOS builds can use bundle ID only.
5. In the app: **Continue with Google** / **Continue with Apple** on the login screen.

### Step 6c — Apple Sign In (Client ID + Secret for Supabase)

Apple does **not** give you a permanent secret like Google. You create:

| Supabase field | What it is | Example for RoundPay |
|----------------|------------|----------------------|
| **Client IDs** | Bundle ID + Services ID (comma-separated) | `com.roundpay.ajoesusu,com.roundpay.ajoesusu.auth` |
| **Secret Key** | A **JWT you generate** from a `.p8` file (expires ~every 6 months) | Run `node scripts/generate-apple-oauth-secret.js` |

**Apple Developer setup** ([developer.apple.com/account](https://developer.apple.com/account)):

1. **App ID** — Identifiers → App IDs → your app (or create)  
   - Bundle ID: `com.roundpay.ajoesusu`  
   - Enable **Sign in with Apple**

2. **Services ID** (this is your OAuth **Client ID**)  
   - Identifiers → **Services IDs** → **+**  
   - Identifier: `com.roundpay.ajoesusu.auth` (you choose; use this pattern)  
   - Enable **Sign in with Apple** → Configure  
   - Primary App ID: `com.roundpay.ajoesusu`  
   - **Domains:** `dolcajrcjhsfpyxzwtjk.supabase.co`  
   - **Return URLs:** `https://dolcajrcjhsfpyxzwtjk.supabase.co/auth/v1/callback`

3. **Signing Key** (for the secret JWT)  
   - Keys → **+** → enable **Sign in with Apple** → Register  
   - Download **`AuthKey_XXXXXXXXXX.p8`** once (you cannot download again)  
   - Note **Key ID** and your **Team ID** (Membership details)

4. **Generate Secret Key for Supabase:**

```bash
node scripts/generate-apple-oauth-secret.js \
  --team-id YOUR_TEAM_ID \
  --key-id YOUR_KEY_ID \
  --services-id com.roundpay.ajoesusu.auth \
  --p8 ./AuthKey_XXXXXXXXXX.p8
```

5. **Supabase** → Authentication → Providers → **Apple**  
   - Enable  
   - **Client IDs:** `com.roundpay.ajoesusu,com.roundpay.ajoesusu.auth`  
   - **Secret Key:** paste the JWT from the script  
   - Save

Set a calendar reminder to re-run the script before the JWT expires (~6 months).

Or use Supabase’s generator: [Login with Apple docs](https://supabase.com/docs/guides/auth/social-login/auth-apple) (scroll to secret generator).

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
