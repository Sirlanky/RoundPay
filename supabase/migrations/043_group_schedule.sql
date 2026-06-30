-- Separate collection and payout schedules (RoundPay create flow).
-- Adds new columns, backfills from legacy frequency + pay_ins_per_cycle, keeps `frequency` in sync.

alter table public.groups
  add column if not exists collection_frequency text,
  add column if not exists custom_collection_days integer,
  add column if not exists payout_frequency text,
  add column if not exists next_collection_date timestamptz,
  add column if not exists next_payout_date timestamptz;

alter table public.groups drop constraint if exists groups_collection_frequency_check;
alter table public.groups drop constraint if exists groups_custom_collection_days_check;
alter table public.groups drop constraint if exists groups_payout_frequency_check;

-- Backfill collection_frequency + custom_collection_days from legacy frequency token.
update public.groups g
set
  collection_frequency = case
    when g.frequency in ('daily', 'day:1') then 'daily'
    when g.frequency in ('weekly', 'week:1') then 'weekly'
    when g.frequency in ('monthly', 'month:1') then 'monthly'
    when g.frequency ~ '^day:[0-9]+$' and g.frequency <> 'day:1' then 'custom'
    when g.frequency ~ '^week:[0-9]+$' and g.frequency <> 'week:1' then 'custom'
    when g.frequency ~ '^month:[0-9]+$' then 'monthly'
    else 'weekly'
  end,
  custom_collection_days = case
    when g.frequency ~ '^day:([0-9]+)$' and g.frequency <> 'day:1'
      then (regexp_match(g.frequency, '^day:([0-9]+)$'))[1]::integer
    when g.frequency ~ '^week:([0-9]+)$' and g.frequency <> 'week:1'
      then (regexp_match(g.frequency, '^week:([0-9]+)$'))[1]::integer * 7
    else null
  end
where g.collection_frequency is null;

-- Backfill payout_frequency from pay_ins_per_cycle + collection pattern.
update public.groups g
set payout_frequency = case
  when coalesce(g.pay_ins_per_cycle, 1) > 1 then 'monthly'
  when g.collection_frequency = 'monthly' then 'end_of_cycle'
  else 'weekly'
end
where g.payout_frequency is null;

alter table public.groups alter column collection_frequency set default 'weekly';
alter table public.groups alter column payout_frequency set default 'weekly';

update public.groups set collection_frequency = 'weekly' where collection_frequency is null;
update public.groups set payout_frequency = 'weekly' where payout_frequency is null;

alter table public.groups alter column collection_frequency set not null;
alter table public.groups alter column payout_frequency set not null;

alter table public.groups
  add constraint groups_collection_frequency_check
  check (collection_frequency in ('daily', 'weekly', 'monthly', 'custom'));

alter table public.groups
  add constraint groups_custom_collection_days_check
  check (
    custom_collection_days is null
    or (custom_collection_days > 0 and custom_collection_days <= 365)
  );

alter table public.groups
  add constraint groups_payout_frequency_check
  check (payout_frequency in ('weekly', 'monthly', 'end_of_cycle'));

-- Schedule helpers (mirrors lib/group-schedule.ts).
create or replace function public.schedule_frequency_token(
  p_collection_frequency text,
  p_custom_collection_days integer
)
returns text
language plpgsql
immutable
set search_path = public
as $$
begin
  case p_collection_frequency
    when 'daily' then return 'day:1';
    when 'weekly' then return 'week:1';
    when 'monthly' then return 'month:1';
    when 'custom' then return 'day:' || greatest(1, least(365, coalesce(p_custom_collection_days, 1)));
    else return 'week:1';
  end case;
end;
$$;

create or replace function public.schedule_collection_days(
  p_collection_frequency text,
  p_custom_collection_days integer
)
returns integer
language plpgsql
immutable
set search_path = public
as $$
begin
  case p_collection_frequency
    when 'daily' then return 1;
    when 'weekly' then return 7;
    when 'monthly' then return 30;
    when 'custom' then return greatest(1, least(365, coalesce(p_custom_collection_days, 1)));
    else return 7;
  end case;
end;
$$;

create or replace function public.schedule_pay_ins_per_cycle(
  p_collection_frequency text,
  p_custom_collection_days integer,
  p_payout_frequency text
)
returns integer
language plpgsql
immutable
set search_path = public
as $$
declare
  coll_days integer;
  payout_days integer;
begin
  if p_payout_frequency = 'end_of_cycle' then
    return 1;
  end if;

  coll_days := public.schedule_collection_days(p_collection_frequency, p_custom_collection_days);
  payout_days := case p_payout_frequency
    when 'weekly' then 7
    when 'monthly' then 30
    else 7
  end;

  return least(52, greatest(1, ceil(payout_days::numeric / coll_days::numeric)::integer));
end;
$$;

create or replace function public.schedule_next_dates(
  p_collection_frequency text,
  p_custom_collection_days integer,
  p_payout_frequency text,
  p_from timestamptz default now()
)
returns table (next_collection_date timestamptz, next_payout_date timestamptz)
language plpgsql
stable
set search_path = public
as $$
declare
  v_freq text;
  v_pay_ins integer;
begin
  v_freq := public.schedule_frequency_token(p_collection_frequency, p_custom_collection_days);
  v_pay_ins := public.schedule_pay_ins_per_cycle(
    p_collection_frequency,
    p_custom_collection_days,
    p_payout_frequency
  );

  next_collection_date := p_from + public.frequency_due_interval(v_freq);
  next_payout_date := p_from + v_pay_ins * public.frequency_due_interval(v_freq);
  return next;
end;
$$;

-- Sync legacy columns + schedule dates for draft groups missing next dates.
update public.groups g
set
  frequency = public.schedule_frequency_token(g.collection_frequency, g.custom_collection_days),
  pay_ins_per_cycle = public.schedule_pay_ins_per_cycle(
    g.collection_frequency,
    g.custom_collection_days,
    g.payout_frequency
  )
where g.status = 'draft';

update public.groups g
set
  next_collection_date = (
    select sn.next_collection_date
    from public.schedule_next_dates(
      g.collection_frequency,
      g.custom_collection_days,
      g.payout_frequency,
      coalesce(g.created_at, now())
    ) sn
  ),
  next_payout_date = (
    select sn.next_payout_date
    from public.schedule_next_dates(
      g.collection_frequency,
      g.custom_collection_days,
      g.payout_frequency,
      coalesce(g.created_at, now())
    ) sn
  )
where g.next_collection_date is null;

-- start_group: use stored schedule, refresh next dates on activation.
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
  v_freq text;
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

  v_freq := public.schedule_frequency_token(g.collection_frequency, g.custom_collection_days);
  pay_ins := public.schedule_pay_ins_per_cycle(
    g.collection_frequency,
    g.custom_collection_days,
    g.payout_frequency
  );
  due := coalesce(g.next_payout_date, public.cycle_due_date(v_freq, pay_ins));

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

  update public.groups
  set
    status = 'active',
    current_cycle = 1,
    frequency = v_freq,
    pay_ins_per_cycle = pay_ins,
    next_collection_date = now() + public.frequency_due_interval(v_freq),
    next_payout_date = due,
    updated_at = now()
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
  v_freq text;
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

  v_freq := public.schedule_frequency_token(g.collection_frequency, g.custom_collection_days);
  pay_ins := public.schedule_pay_ins_per_cycle(
    g.collection_frequency,
    g.custom_collection_days,
    g.payout_frequency
  );
  due := public.cycle_due_date(v_freq, pay_ins);

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

  update public.groups
  set
    current_cycle = next_num,
    next_collection_date = now() + public.frequency_due_interval(v_freq),
    next_payout_date = due,
    updated_at = now()
  where id = p_group_id;

  return new_cycle_id;
end;
$$;

revoke all on function public.schedule_frequency_token(text, integer) from public;
grant execute on function public.schedule_frequency_token(text, integer) to authenticated;

revoke all on function public.schedule_collection_days(text, integer) from public;
grant execute on function public.schedule_collection_days(text, integer) to authenticated;

revoke all on function public.schedule_pay_ins_per_cycle(text, integer, text) from public;
grant execute on function public.schedule_pay_ins_per_cycle(text, integer, text) to authenticated;

revoke all on function public.schedule_next_dates(text, integer, text, timestamptz) from public;
grant execute on function public.schedule_next_dates(text, integer, text, timestamptz) to authenticated;

revoke all on function public.start_group(uuid) from public;
grant execute on function public.start_group(uuid) to authenticated;

revoke all on function public.advance_cycle(uuid) from public;
grant execute on function public.advance_cycle(uuid) to authenticated;
