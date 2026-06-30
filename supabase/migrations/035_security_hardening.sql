-- Tighten RPC execute grants and address Supabase advisor warnings.

-- search_path hardening (lint 0011)
alter function public.set_updated_at() set search_path = public;
alter function public.is_group_member(uuid, uuid) set search_path = public;
alter function public.format_naira_amount(integer) set search_path = public;
alter function public.frequency_due_interval(text) set search_path = public;

-- Client-callable RPCs: authenticated only (lint 0028)
do $grant$
declare
  fn regprocedure;
begin
  foreach fn in array array[
    'public.advance_cycle(uuid)'::regprocedure,
    'public.archive_group(uuid)'::regprocedure,
    'public.delete_draft_group(uuid)'::regprocedure,
    'public.ensure_my_profile()'::regprocedure,
    'public.get_admin_dashboard_stats(uuid)'::regprocedure,
    'public.get_conversations()'::regprocedure,
    'public.get_shared_groups(uuid)'::regprocedure,
    'public.record_contribution_payment(uuid)'::regprocedure,
    'public.record_cycle_payout(uuid)'::regprocedure,
    'public.set_admin_participation(uuid,boolean)'::regprocedure,
    'public.start_group(uuid)'::regprocedure,
    'public.submit_identity_verification()'::regprocedure,
    'public.submit_placeholder_identity_verification()'::regprocedure
  ]
  loop
    execute format('revoke all on function %s from public', fn);
    execute format('revoke all on function %s from anon', fn);
    execute format('grant execute on function %s to authenticated', fn);
  end loop;
end
$grant$;

-- Internal / trigger helpers: not callable from the Data API
do $lock$
declare
  fn regprocedure;
begin
  foreach fn in array array[
    'public.check_verified_admin_before_group_insert()'::regprocedure,
    'public.create_notification(uuid,uuid,text,text,text,uuid)'::regprocedure,
    'public.dispatch_push_for_notification()'::regprocedure,
    'public.format_naira_amount(integer)'::regprocedure,
    'public.frequency_due_interval(text)'::regprocedure,
    'public.guard_profile_identity_status()'::regprocedure,
    'public.handle_new_user()'::regprocedure,
    'public.notify_on_contribution_paid()'::regprocedure,
    'public.notify_on_direct_message()'::regprocedure,
    'public.notify_on_member_joined()'::regprocedure,
    'public.notify_on_payout_completed()'::regprocedure,
    'public.require_verified_group_admin(uuid)'::regprocedure,
    'public.rls_auto_enable()'::regprocedure,
    'public.set_updated_at()'::regprocedure
  ]
  loop
    execute format('revoke all on function %s from public', fn);
    execute format('revoke all on function %s from anon', fn);
    execute format('revoke all on function %s from authenticated', fn);
  end loop;
end
$lock$;

grant execute on function public.create_notification(uuid,uuid,text,text,text,uuid) to service_role;

-- Public avatars bucket: drop broad SELECT policy (lint 0025).
-- Public buckets serve direct URLs without listing every object.
drop policy if exists "Avatar images are publicly accessible" on storage.objects;

notify pgrst, 'reload schema';
