-- Admin can delete a group while it is still in draft (not started).

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

  delete from public.groups where id = p_group_id;
end;
$$;

revoke all on function public.delete_draft_group(uuid) from public;
grant execute on function public.delete_draft_group(uuid) to authenticated;

-- Fallback if RPC is missing: direct delete under RLS
drop policy if exists "Admin can delete draft groups" on public.groups;
create policy "Admin can delete draft groups"
  on public.groups for delete
  to authenticated
  using (admin_id = auth.uid() and status = 'draft');
