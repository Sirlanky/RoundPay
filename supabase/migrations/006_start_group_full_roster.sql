-- Start group only when every roster slot is filled (member count = max_members).

create or replace function public.start_group(p_group_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  g public.groups%rowtype;
  member_count integer;
  new_cycle_id uuid;
  recipient_user_id uuid;
  due timestamptz;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select * into g from public.groups where id = p_group_id for update;
  if not found then
    raise exception 'Group not found';
  end if;
  if g.admin_id <> auth.uid() then
    raise exception 'Only the admin can start this group';
  end if;
  if g.status <> 'draft' then
    raise exception 'Group cannot be started';
  end if;

  select count(*)::integer into member_count from public.group_members where group_id = p_group_id;
  if member_count < g.max_members then
    raise exception 'All % members must join before starting', g.max_members;
  end if;

  select user_id into recipient_user_id
  from public.group_members
  where group_id = p_group_id
  order by rotation_order
  limit 1;

  if recipient_user_id is null then
    raise exception 'No members in group';
  end if;

  if g.frequency = 'weekly' then
    due := now() + interval '7 days';
  else
    due := now() + interval '1 month';
  end if;

  insert into public.cycles (group_id, cycle_number, recipient_id, due_date, status)
  values (p_group_id, 1, recipient_user_id, due, 'collecting')
  returning id into new_cycle_id;

  insert into public.contributions (cycle_id, member_id, user_id, amount, status)
  select new_cycle_id, gm.id, gm.user_id, g.contribution_amount, 'pending'
  from public.group_members gm
  where gm.group_id = p_group_id;

  update public.groups
  set status = 'active', current_cycle = 1, updated_at = now()
  where id = p_group_id;

  return new_cycle_id;
end;
$$;

revoke all on function public.start_group(uuid) from public;
grant execute on function public.start_group(uuid) to authenticated;
