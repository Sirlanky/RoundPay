-- Push notification preferences

alter table public.profiles
  add column if not exists push_enabled boolean not null default true;

comment on column public.profiles.push_enabled is
  'When false, the app and server skip registering/sending push notifications for this user.';

notify pgrst, 'reload schema';

-- After deploying the dispatch-push edge function, add a Database Webhook in Supabase:
-- Table: public.notifications | Event: INSERT | URL: /functions/v1/dispatch-push
-- Header: Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>
-- This sends a push for in-app alerts created by DB triggers (member joined, payment, payout).
