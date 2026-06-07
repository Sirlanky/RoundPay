-- Harden draft group delete (explicit notification cleanup + safe member-join trigger).

create or replace function public.notify_on_member_joined()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  g public.groups%rowtype;
  joiner_name text;
  member record;
begin
  select * into g from public.groups where id = new.group_id;
  if not found then
    return new;
  end if;

  select coalesce(nullif(trim(full_name), ''), 'A member')
  into joiner_name
  from public.profiles
  where id = new.user_id;

  if g.admin_id is distinct from new.user_id then
    perform public.create_notification(
      g.admin_id,
      new.group_id,
      'member_joined',
      'New member joined',
      joiner_name || ' joined "' || g.name || '".',
      new.id
    );
  end if;

  for member in
    select gm.user_id
    from public.group_members gm
    where gm.group_id = new.group_id
      and gm.user_id not in (new.user_id, g.admin_id)
  loop
    perform public.create_notification(
      member.user_id,
      new.group_id,
      'member_joined',
      'New member joined',
      joiner_name || ' joined "' || g.name || '".',
      new.id
    );
  end loop;

  perform public.create_notification(
    new.user_id,
    new.group_id,
    'group_joined',
    'You joined a group',
    'Welcome to "' || g.name || '".',
    new.group_id
  );

  return new;
end;
$$;

create or replace function public.delete_draft_group(p_group_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  g public.groups%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select * into g from public.groups where id = p_group_id;

  if not found then
    raise exception 'Group not found';
  end if;

  if g.admin_id <> auth.uid() then
    raise exception 'Only the admin can delete this group';
  end if;

  if g.status <> 'draft' then
    raise exception 'Only draft groups can be deleted';
  end if;

  delete from public.notifications where group_id = p_group_id;
  delete from public.groups where id = p_group_id;
end;
$$;

revoke all on function public.delete_draft_group(uuid) from public;
grant execute on function public.delete_draft_group(uuid) to authenticated;

notify pgrst, 'reload schema';
