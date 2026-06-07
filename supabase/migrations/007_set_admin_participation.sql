-- Admin join/leave rotation on draft groups (fixes RLS + rotation_order conflicts).

create or replace function public.set_admin_participation(p_group_id uuid, p_participates boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  g public.groups%rowtype;
  member_count integer;
  existing_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select * into g from public.groups where id = p_group_id;
  if not found then
    raise exception 'Group not found';
  end if;
  if g.admin_id <> auth.uid() then
    raise exception 'Only the admin can change this';
  end if;
  if g.status <> 'draft' then
    raise exception 'Cannot change after the group has started';
  end if;

  select id into existing_id
  from public.group_members
  where group_id = p_group_id and user_id = auth.uid();

  if p_participates then
    if existing_id is not null then
      return;
    end if;

    select count(*)::integer into member_count
    from public.group_members
    where group_id = p_group_id;

    if member_count >= g.max_members then
      raise exception 'Group is full';
    end if;

    insert into public.group_members (group_id, user_id, rotation_order, role)
    values (p_group_id, auth.uid(), member_count + 1, 'admin');
    return;
  end if;

  if existing_id is null then
    return;
  end if;

  delete from public.group_members where id = existing_id;

  -- Avoid unique (group_id, rotation_order) conflicts while renumbering.
  update public.group_members
  set rotation_order = rotation_order + 10000
  where group_id = p_group_id;

  update public.group_members gm
  set rotation_order = sub.rn
  from (
    select id, row_number() over (order by rotation_order)::integer as rn
    from public.group_members
    where group_id = p_group_id
  ) sub
  where gm.id = sub.id;
end;
$$;

revoke all on function public.set_admin_participation(uuid, boolean) from public;
grant execute on function public.set_admin_participation(uuid, boolean) to authenticated;
