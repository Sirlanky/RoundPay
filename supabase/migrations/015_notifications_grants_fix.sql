-- Re-apply if create_notification is callable from the client (security + trigger helper).

revoke all on function public.create_notification(uuid, uuid, text, text, text, uuid) from public;
revoke all on function public.create_notification(uuid, uuid, text, text, text, uuid) from anon;
revoke all on function public.create_notification(uuid, uuid, text, text, text, uuid) from authenticated;
grant execute on function public.create_notification(uuid, uuid, text, text, text, uuid) to service_role;

-- Ensure triggers exist (safe to re-run)
drop trigger if exists group_members_notify_joined on public.group_members;
create trigger group_members_notify_joined
  after insert on public.group_members
  for each row execute function public.notify_on_member_joined();

drop trigger if exists contributions_notify_paid on public.contributions;
create trigger contributions_notify_paid
  after update on public.contributions
  for each row execute function public.notify_on_contribution_paid();

drop trigger if exists payouts_notify_completed on public.payouts;
create trigger payouts_notify_completed
  after insert or update on public.payouts
  for each row execute function public.notify_on_payout_completed();

notify pgrst, 'reload schema';
