-- RLS policies call these helpers as the authenticated role; keep them off anon/public.

revoke all on function public.is_group_member(uuid, uuid) from public;
revoke all on function public.is_group_member(uuid, uuid) from anon;
grant execute on function public.is_group_member(uuid, uuid) to authenticated;

revoke all on function public.users_share_group(uuid, uuid) from public;
revoke all on function public.users_share_group(uuid, uuid) from anon;
grant execute on function public.users_share_group(uuid, uuid) to authenticated;

notify pgrst, 'reload schema';
