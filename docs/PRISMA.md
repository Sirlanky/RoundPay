# Prisma (dev tooling only)

This Expo app uses **`@supabase/supabase-js`** on the device for Auth, RLS, and Realtime.

**Prisma is not used inside the mobile app.** Direct Postgres URLs must never be bundled in Expo (`EXPO_PUBLIC_*`).

Prisma is set up for:

- Schema documentation aligned with `supabase/migrations/001_schema.sql`
- Optional `prisma db pull` / `prisma migrate` from your machine
- `prisma studio` to browse data during development

## Configure database URLs (local only)

Add to **`.env`** (gitignored), not `.env.local`:

```env
# Transaction pooler (port 6543) — for Prisma Client queries
DATABASE_URL="postgresql://postgres.dolcajrcjhsfpyxzwtjk:[YOUR-PASSWORD]@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Session pooler (port 5432) — for migrations
DIRECT_URL="postgresql://postgres.dolcajrcjhsfpyxzwtjk:[YOUR-PASSWORD]@aws-0-eu-west-1.pooler.supabase.com:5432/postgres"
```

Replace `[YOUR-PASSWORD]` with your Supabase database password (Project Settings → Database).

Confirm region/host in Supabase **Connect** dialog if your pooler host differs.

## Commands

```bash
npm run prisma:generate   # Generate client to generated/prisma
npm run prisma:pull       # Introspect live DB into schema (after DATABASE_URL set)
npm run prisma:studio     # Browse tables in browser
```

## Source of truth

For production, keep using **Supabase SQL migrations** in `supabase/migrations/`. If you change schema with Prisma, export SQL or keep both in sync manually.
