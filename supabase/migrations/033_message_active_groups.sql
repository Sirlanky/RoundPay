-- Allow messaging between co-members and group admins for active/completed circles only.

create or replace function public.users_share_group(a uuid, b uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.groups g
    where g.status in ('active', 'completed')
      and (
        (
          exists (
            select 1 from public.group_members gm
            where gm.group_id = g.id and gm.user_id = a
          )
          and exists (
            select 1 from public.group_members gm
            where gm.group_id = g.id and gm.user_id = b
          )
        )
        or (
          exists (
            select 1 from public.group_members gm
            where gm.group_id = g.id and gm.user_id = a
          )
          and g.admin_id = b
        )
        or (
          exists (
            select 1 from public.group_members gm
            where gm.group_id = g.id and gm.user_id = b
          )
          and g.admin_id = a
        )
      )
  );
$$;

create or replace function public.get_shared_groups(p_other uuid)
returns table (id uuid, name text, status text)
language sql
stable
security definer
set search_path = public
as $$
  select g.id, g.name, g.status
  from public.groups g
  where g.status in ('active', 'completed')
    and exists (
      select 1 from public.group_members gm
      where gm.group_id = g.id and gm.user_id = auth.uid()
    )
    and (
      exists (
        select 1 from public.group_members gm
        where gm.group_id = g.id and gm.user_id = p_other
      )
      or g.admin_id = p_other
    )
  order by g.created_at desc;
$$;

notify pgrst, 'reload schema';
