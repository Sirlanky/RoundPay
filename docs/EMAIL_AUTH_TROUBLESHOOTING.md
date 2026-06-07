# No sign-in email / 6-digit code

If you get **no email at all** (not even in spam), the app is usually fine — **Supabase** is not sending mail.

## 1. Check Supabase Auth logs (most important)

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project  
2. **Authentication** → **Logs** (or **Auth** → **Logs**)  
3. Try **Send sign-in email** in the app once  
4. Look for:
   - **Success** — email was handed off (check spam / SMTP limits below)  
   - **rate limit** — wait **1 hour**, do not keep tapping Resend  
   - **SMTP / email error** — set up custom SMTP (step 4)

## 2. Default Supabase email limits (free)

- About **2–4 emails per hour** for the whole project  
- On many projects, default mail only goes to emails on your **Supabase organization team**  
- **Fix:** add your test email as a team member in Supabase **Organization settings**, **or** use custom SMTP (step 4)

## 3. Get a 6-digit code (not only a link)

Supabase’s default template often sends a **link**, not a code.

1. **Authentication** → **Email Templates** → **Magic Link** (sign-in from login screen)  
2. Also edit **Change Email Address** (guest linking email on an anonymous account)  
3. Include in the body of **both** templates:

```html
<p>Your sign-in code: <strong>{{ .Token }}</strong></p>
<p>Or tap this link: <a href="{{ .ConfirmationURL }}">Sign in</a></p>
```

4. **Save**

Without `{{ .Token }}`, you may only get a link — not a 6-digit code.

## 4. Recommended fix: custom SMTP (Resend)

1. Create a free account at [resend.com](https://resend.com)  
2. Supabase → **Authentication** → **SMTP** → enable **Custom SMTP**  
3. Add Resend SMTP host, user, password, sender address  
4. **Authentication** → **Rate Limits** — raise email limit slightly for testing  
5. Try sign-in again

## 5. App settings checklist

| Setting | Where | Should be |
|--------|--------|------------|
| Email provider | Auth → Providers → Email | **Enabled** |
| Confirm email | Auth → Providers → Email | **Off** (for testing) |
| Redirect URLs | Auth → URL configuration | `ajoesusu://**`, `exp://**` |
| `.env` | Your project | Real `EXPO_PUBLIC_SUPABASE_URL` and anon key |

## 6. While email is broken

1. Enable **Anonymous sign-ins** in Supabase (**Authentication** → **Providers** → **Anonymous**).  
2. In the app: **Continue as guest (create groups)** on login, or **Guest account** when creating a group.  
3. **Preview UI only** still cannot save — use guest for real groups.

Use **Sign in with email** when SMTP works or you need a permanent account.

## 7. Still stuck?

Note from Auth logs:

- Exact error message  
- Email address you used  
- Whether you use **Expo Go** or a **dev build**
