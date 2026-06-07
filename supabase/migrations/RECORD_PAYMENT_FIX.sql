-- Paste into Supabase → SQL Editor → Run once.
-- Fixes "Record payment" not marking contributions as paid.

drop policy if exists "Admin can update contributions" on public.contributions;
create policy "Admin can update contributions"
  on public.contributions for update
  using (
    exists (
      select 1 from public.cycles c
      join public.groups g on g.id = c.group_id
      where c.id = contributions.cycle_id
        and g.admin_id = auth.uid()
    )
  );

drop policy if exists "Members can update own contributions" on public.contributions;

create or replace function public.record_contribution_payment(p_contribution_id uuid)
returns void
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  c public.contributions%rowtype;
  cy public.cycles%rowtype;
  g public.groups%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select * into c from public.contributions where id = p_contribution_id;
  if not found then
    raise exception 'Contribution not found';
  end if;

  if c.status = 'paid' then
    return;
  end if;

  select * into cy from public.cycles where id = c.cycle_id;
  if not found then
    raise exception 'Cycle not found';
  end if;

  select * into g from public.groups where id = cy.group_id;
  if not found then
    raise exception 'Group not found';
  end if;

  if g.admin_id <> auth.uid() then
    raise exception 'Only admin can record payments';
  end if;

  if cy.status not in ('collecting', 'open') then
    raise exception 'This cycle is not accepting payments';
  end if;

  update public.contributions
  set
    status = 'paid',
    paid_at = now(),
    paystack_reference = coalesce(
      paystack_reference,
      'manual_' || substr(replace(p_contribution_id::text, '-', ''), 1, 12)
    )
  where id = p_contribution_id;

  if not exists (
    select 1 from public.contributions
    where cycle_id = c.cycle_id and status <> 'paid'
  ) then
    update public.cycles
    set status = 'completed'
    where id = c.cycle_id;
  end if;
end;
$$;

revoke all on function public.record_contribution_payment(uuid) from public;
grant execute on function public.record_contribution_payment(uuid) to authenticated;

notify pgrst, 'reload schema';
