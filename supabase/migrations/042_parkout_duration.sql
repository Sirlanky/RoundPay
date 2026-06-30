-- Parkout: collection due after pay_ins_per_cycle × pay-in frequency (not a fixed monthly interval).

create or replace function public.cycle_due_date(p_frequency text, p_pay_ins_per_cycle integer)
returns timestamptz
language sql
stable
set search_path = public
as $$
  select
    now()
    + greatest(1, coalesce(p_pay_ins_per_cycle, 1))
      * public.frequency_due_interval(p_frequency);
$$;

create or replace function public.start_group(p_group_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  g public.groups%rowtype;
  member_count integer;
  slot_count integer;
  new_cycle_id uuid;
  recipient_user_id uuid;
  due timestamptz;
  pay_ins integer;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if not public.profile_is_verified(auth.uid()) then raise exception 'IDENTITY_NOT_VERIFIED'; end if;

  select * into g from public.groups where id = p_group_id for update;
  if not found then raise exception 'Group not found'; end if;
  if g.admin_id <> auth.uid() then raise exception 'Only the admin can start this group'; end if;
  if g.status <> 'draft' then raise exception 'Group cannot be started'; end if;

  select count(*)::integer into member_count from public.group_members where group_id = p_group_id;
  if member_count < g.max_members then
    raise exception 'All % members must join before starting', g.max_members;
  end if;

  select count(*)::integer into slot_count from public.group_payout_slots where group_id = p_group_id;
  if slot_count < 1 then
    perform public.sync_payout_slots_from_members(p_group_id);
    select count(*)::integer into slot_count from public.group_payout_slots where group_id = p_group_id;
  end if;
  if slot_count < 1 then raise exception 'No payout order configured'; end if;

  select user_id into recipient_user_id
  from public.group_payout_slots
  where group_id = p_group_id and position = 1;

  pay_ins := greatest(1, coalesce(g.pay_ins_per_cycle, 1));
  due := public.cycle_due_date(g.frequency, pay_ins);

  insert into public.cycles (group_id, cycle_number, recipient_id, due_date, status)
  values (p_group_id, 1, recipient_user_id, due, 'collecting')
  returning id into new_cycle_id;

  insert into public.contributions (cycle_id, member_id, user_id, amount, status, installment_number)
  select
    new_cycle_id,
    gm.id,
    gm.user_id,
    g.contribution_amount,
    'pending',
    inst.n
  from public.group_members gm
  cross join generate_series(1, pay_ins) as inst(n)
  where gm.group_id = p_group_id;

  update public.groups set status = 'active', current_cycle = 1, updated_at = now()
  where id = p_group_id;

  return new_cycle_id;
end;
$$;

create or replace function public.advance_cycle(p_group_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  g public.groups%rowtype;
  cy public.cycles%rowtype;
  next_num integer;
  recipient_user_id uuid;
  new_cycle_id uuid;
  due timestamptz;
  slot_count integer;
  pay_ins integer;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;

  select * into g from public.groups where id = p_group_id for update;
  if not found then raise exception 'Group not found'; end if;
  if g.admin_id <> auth.uid() then raise exception 'Only admin can advance cycle'; end if;

  select * into cy from public.cycles
  where group_id = p_group_id and cycle_number = g.current_cycle;

  if not found or cy.status <> 'paid_out' then
    raise exception 'Current cycle must be paid out before advancing';
  end if;

  select count(*)::integer into slot_count from public.group_payout_slots where group_id = p_group_id;
  next_num := g.current_cycle + 1;

  if next_num > slot_count then
    update public.groups set status = 'completed', updated_at = now() where id = p_group_id;
    return null;
  end if;

  select user_id into recipient_user_id
  from public.group_payout_slots
  where group_id = p_group_id and position = next_num;

  if recipient_user_id is null then
    raise exception 'Could not find collector for next cycle';
  end if;

  pay_ins := greatest(1, coalesce(g.pay_ins_per_cycle, 1));
  due := public.cycle_due_date(g.frequency, pay_ins);

  insert into public.cycles (group_id, cycle_number, recipient_id, due_date, status)
  values (p_group_id, next_num, recipient_user_id, due, 'collecting')
  returning id into new_cycle_id;

  insert into public.contributions (cycle_id, member_id, user_id, amount, status, installment_number)
  select
    new_cycle_id,
    gm.id,
    gm.user_id,
    g.contribution_amount,
    'pending',
    inst.n
  from public.group_members gm
  cross join generate_series(1, pay_ins) as inst(n)
  where gm.group_id = p_group_id;

  update public.groups set current_cycle = next_num, updated_at = now() where id = p_group_id;

  return new_cycle_id;
end;
$$;

revoke all on function public.cycle_due_date(text, integer) from public;
grant execute on function public.cycle_due_date(text, integer) to authenticated;

revoke all on function public.start_group(uuid) from public;
grant execute on function public.start_group(uuid) to authenticated;

revoke all on function public.advance_cycle(uuid) from public;
grant execute on function public.advance_cycle(uuid) to authenticated;
