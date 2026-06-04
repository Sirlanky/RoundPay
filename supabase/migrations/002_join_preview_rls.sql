-- Let authenticated users preview draft groups by invite code (join flow)

create policy "Authenticated can view draft groups to join"
  on public.groups for select
  using (status = 'draft' and auth.uid() is not null);

create policy "Authenticated can view members on draft groups"
  on public.group_members for select
  using (
    auth.uid() is not null
    and exists (
      select 1 from public.groups g
      where g.id = group_id and g.status = 'draft'
    )
  );
