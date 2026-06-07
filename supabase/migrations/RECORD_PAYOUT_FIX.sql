-- Paste into Supabase → SQL Editor → Run once.
-- Fixes "Send payout" / Record payout sent.

drop policy if exists "Admin can insert payouts" on public.payouts;
create policy "Admin can insert payouts"
  on public.payouts for insert
  with check (
    exists (
      select 1 from public.cycles c
      join public.groups g on g.id = c.group_id
      where c.id = cycle_id and g.admin_id = auth.uid()
    )
  );

drop policy if exists "Admin can update payouts" on public.payouts;
create policy "Admin can update payouts"
  on public.payouts for update
  using (
    exists (
      select 1 from public.cycles c
      join public.groups g on g.id = c.group_id
      where c.id = cycle_id and g.admin_id = auth.uid()
    )
  );

create or replace function public.record_cycle_payout(p_cycle_id uuid)
returns void
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  cy public.cycles%rowtype;
  g public.groups%rowtype;
  total integer;
  payout_amount integer;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select * into cy from public.cycles where id = p_cycle_id;
  if not found then
    raise exception 'Cycle not found';
  end if;

  select * into g from public.groups where id = cy.group_id;
  if not found then
    raise exception 'Group not found';
  end if;

  if g.admin_id <> auth.uid() then
    raise exception 'Only admin can record payout';
  end if;

  if cy.status <> 'completed' then
    raise exception 'All members must pay before payout';
  end if;

  if exists (
    select 1 from public.contributions
    where cycle_id = p_cycle_id and status <> 'paid'
  ) then
    raise exception 'Not all contributions are paid';
  end if;

  select coalesce(sum(amount), 0)::integer into total
  from public.contributions
  where cycle_id = p_cycle_id;

  payout_amount := floor(total * (1 - coalesce(g.admin_fee_percent, 0) / 100.0))::integer;

  insert into public.payouts (cycle_id, recipient_id, amount, status, paystack_transfer_code)
  values (p_cycle_id, cy.recipient_id, payout_amount, 'completed', 'manual')
  on conflict (cycle_id) do update
  set
    amount = excluded.amount,
    status = 'completed',
    paystack_transfer_code = coalesce(public.payouts.paystack_transfer_code, 'manual');

  update public.cycles set status = 'paid_out' where id = p_cycle_id;

  update public.group_members
  set has_collected = true
  where group_id = cy.group_id and user_id = cy.recipient_id;
end;
$$;

revoke all on function public.record_cycle_payout(uuid) from public;
grant execute on function public.record_cycle_payout(uuid) to authenticated;

notify pgrst, 'reload schema';
