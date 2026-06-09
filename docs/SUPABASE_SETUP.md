# Supabase setup for RoundPay

Complete checklist for login, database, and Paystack. Do this in the [Supabase Dashboard](https://supabase.com/dashboard) — not in the app.

---

## 1. Project and `.env`

1. Create a project (region close to your users, e.g. EU).
2. **Project Settings → API** — copy:
   - **Project URL** → `EXPO_PUBLIC_SUPABASE_URL`
   - **anon public** key → `EXPO_PUBLIC_SUPABASE_ANON_KEY`
3. In the repo:

```bash
cp .env.example .env
npm run env:check
npx expo start --clear
```

If `env:check` fails, fix `.env` before continuing.

---

## 2. Authentication providers

**Authentication → Providers**

| Provider | Setting |
|----------|---------|
| **Email** | Enabled |
| **Confirm email** | Off (for testing) |
| **Anonymous** | Enabled (for **Enter app** without email) |

---

## 3. Email template (6-digit code)

Default Supabase email is **link only**. The app needs a code in the message.

**Authentication → Email Templates → Magic Link**

Use a body like:

```html
<h2>RoundPay sign-in</h2>
<p>Your code: <strong>{{ .Token }}</strong></p>
<p>Or open this link: {{ .ConfirmationURL }}</p>
```

Also edit **Change Email Address** the same way if guests link an email later.

Save both templates. Without `{{ .Token }}`, users never get a 6-digit code.

---

## 4. Redirect URLs (email links)

**Authentication → URL configuration**

| Field | Value |
|-------|--------|
| **Site URL** | `ajoesusu://` |

**Redirect URLs** — add each line:

```
ajoesusu://**
exp://**
```

**Expo Go on a physical iPhone:** when you run `npx expo start`, Metro prints a URL like `exp://192.168.1.12:8081`. Add:

```
exp://192.168.1.12:8081/**
```

(Use your machine's IP from the Metro terminal — it changes if your Wi-Fi changes.)

On iPhone, **prefer typing the 6-digit code** in the app. Email links in Expo Go are unreliable even when redirects are correct.

---

## 5. Reliable email (recommended)

Supabase's built-in mail is limited (~2–4 emails/hour on free tier) and often lands in spam.

1. Sign up at [resend.com](https://resend.com)
2. **Authentication → SMTP** → enable custom SMTP with Resend credentials
3. **Authentication → Rate Limits** — raise email limit slightly for testing
4. Send a test sign-in from the app
5. Check **Authentication → Logs** if nothing arrives

See also: [docs/EMAIL_AUTH_TROUBLESHOOTING.md](./EMAIL_AUTH_TROUBLESHOOTING.md)

---

## 6. Database migrations

Run in **SQL Editor → New query** (in order):

1. `supabase/migrations/001_schema.sql` — core tables
2. All other files in `supabase/migrations/` in numeric order (002, 003, …)
3. If **Enter app** fails with profile errors: `supabase/migrations/RUN_IN_SQL_EDITOR.sql`

Confirm in **Table Editor**: `profiles`, `groups`, `group_members`, `cycles`, `contributions` exist.

---

## 7. Paystack (optional — bank payouts)

Only needed when admins send payouts through Paystack.

1. `.env`: `EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_...`
2. Link and deploy:

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase secrets set PAYSTACK_SECRET_KEY=sk_test_xxx
npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
npm run supabase:deploy-functions
```

3. Paystack dashboard → Webhooks:

```
https://YOUR_PROJECT_REF.supabase.co/functions/v1/paystack-webhook
```

Contributions are recorded by the admin by default. Card collection is off unless you set `EXPO_PUBLIC_PAYSTACK_COLLECT_CONTRIBUTIONS=true` in `.env`.

---

## 8. Verify login works

1. Restart app: `npx expo start --clear`
2. **Email path:** enter email → **Send sign-in email** → enter **6-digit code** on next screen
3. **Guest path:** **Enter app** (requires Anonymous provider on)

If email fails, check **Authentication → Logs** for the exact error.

---

## Quick troubleshooting

| Symptom | Fix |
|---------|-----|
| App shows **Setup** screen | Fix `.env`; run `npm run env:check` |
| No email | Auth Logs; spam; set up SMTP (step 5) |
| No 6-digit code in email | Add `{{ .Token }}` to Magic Link template (step 3) |
| Link opens Safari, nothing happens | Add `exp://**` and your Metro `exp://IP:8081/**` URL (step 4); use code instead |
| Rate limit | Wait 1 hour; don't spam Resend |
| Enter app fails | Enable Anonymous provider; run `RUN_IN_SQL_EDITOR.sql` |
| Groups / profile errors | Run migrations (step 6) |
