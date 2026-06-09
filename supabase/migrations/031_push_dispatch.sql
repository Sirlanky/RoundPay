-- Guarantee push delivery in code: whenever a notification row is inserted,
-- call the dispatch-push edge function via pg_net. This removes the dependency
-- on a manually-configured Database Webhook (the old, easy-to-miss setup step).
--
-- ONE-TIME SETUP (run once in the SQL editor, then reconnect):
--   alter database postgres
--     set app.settings.service_role_key = '<YOUR SERVICE ROLE KEY>';
-- The edge base URL is derived from the project ref below; change if needed.

create extension if not exists pg_net with schema extensions;

create or replace function public.dispatch_push_for_notification()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  edge_base_url text := 'https://dolcajrcjhsfpyxzwtjk.supabase.co/functions/v1';
  service_key text := current_setting('app.settings.service_role_key', true);
begin
  -- If the key isn't configured yet, skip push silently. The in-app
  -- notification row is still created, so nothing breaks.
  if service_key is null or service_key = '' then
    return new;
  end if;

  perform net.http_post(
    url := edge_base_url || '/dispatch-push',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_key
    ),
    body := jsonb_build_object('record', to_jsonb(new))
  );

  return new;
end;
$$;

drop trigger if exists notifications_dispatch_push on public.notifications;
create trigger notifications_dispatch_push
  after insert on public.notifications
  for each row execute function public.dispatch_push_for_notification();

notify pgrst, 'reload schema';
