-- Admin can manage a group without being in the rotation.
-- Extend access checks and allow leaving a draft group before cycle 1.

create or replace function public.is_group_member(gid uuid, uid uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.group_members
    where group_id = gid and user_id = uid
  ) or exists (
    select 1 from public.groups
    where id = gid and admin_id = uid
  );
$$;

create policy "Users can leave draft groups"
  on public.group_members for delete
  using (
    auth.uid() = user_id
    and exists (
      select 1 from public.groups g
      where g.id = group_id and g.status = 'draft'
    )
  );
