# Building the app (skip sign-in for now)

Auth email / rate limits can wait. Use **build mode** to work on screens and flows.

## Open the app without signing in

**Option A — button (easiest)**

1. `npx expo start --clear`
2. In dev, the app usually **enters automatically** with a guest account. If not, login → **Enter app**, or Profile → **Your account** → **Enter app (no email)**
3. You land on Home / Groups / Profile with a green banner at the top

**Option B — auto-skip**

Add to `.env`:

```env
EXPO_PUBLIC_SKIP_AUTH=true
```

Restart Expo. The app opens straight to the main tabs.

## What you can build now

| Area | Screens | Notes |
|------|---------|--------|
| Home | `(tabs)/index` | Create / join group buttons |
| Groups | `(tabs)/groups`, `group/create`, `group/join` | Create/join UI works in build mode; saving needs sign-in. Join shows a **preview** when code is 6 chars (run `002_join_preview_rls.sql` in Supabase) |
| Group detail | `group/[id]/index` | Cycles, members, pay, payout |
| Pay | `group/[id]/pay` | Needs Paystack + Edge Functions |
| Profile | `(tabs)/profile`, `profile/bank` | Bank verify via Paystack |

UI-only work (layout, copy, navigation) works in build mode. **Saving to Supabase** needs a real account later.

## Run the app

```bash
cd ~/Desktop/Projects/ajo-esusu
npx expo start --clear
```

## When you return to sign-in

1. Remove `EXPO_PUBLIC_SKIP_AUTH` or set it to `false`
2. Sign out from Profile (or restart without build mode)
3. Use email OTP again (after rate limit resets) or set up custom SMTP

## Database (one time)

If create/join fails with “relation does not exist”, run `supabase/migrations/001_schema.sql` in the Supabase SQL Editor.
