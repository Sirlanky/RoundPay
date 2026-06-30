-- RoundPayAjo: payout order, payment methods, identity gates, cycle swap agreements.

-- ---------------------------------------------------------------------------
-- Payout order (supports duplicate user_id = multiple collections per member)
-- ---------------------------------------------------------------------------
create table if not exists public.group_payout_slots (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  position integer not null check (position > 0),
  user_id uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  unique (group_id, position)
);

create index if not exists group_payout_slots_group_id_idx on public.group_payout_slots(group_id);

alter table public.group_payout_slots enable row level security;

create policy "Members can view payout slots"
  on public.group_payout_slots for select
  using (
    public.is_group_member(group_id, auth.uid())
    or exists (select 1 from public.groups g where g.id = group_id and g.admin_id = auth.uid())
  );

create policy "Admin manages payout slots on draft groups"
  on public.group_payout_slots for all
  using (
    exists (
      select 1 from public.groups g
      where g.id = group_id and g.admin_id = auth.uid() and g.status = 'draft'
    )
  )
  with check (
    exists (
      select 1 from public.groups g
      where g.id = group_id and g.admin_id = auth.uid() and g.status = 'draft'
    )
  );

-- Backfill from rotation_order for existing groups
insert into public.group_payout_slots (group_id, position, user_id)
select gm.group_id, gm.rotation_order, gm.user_id
from public.group_members gm
where not exists (
  select 1 from public.group_payout_slots s where s.group_id = gm.group_id
);

-- ---------------------------------------------------------------------------
-- Payment method on contributions
-- ---------------------------------------------------------------------------
alter table public.contributions
  add column if not exists payment_method text
    check (payment_method is null or payment_method in ('paystack', 'cash', 'bank_transfer', 'pos', 'other'));

alter table public.contributions
  add column if not exists payment_note text;

-- ---------------------------------------------------------------------------
-- Track multiple collections per member
-- ---------------------------------------------------------------------------
alter table public.group_members
  add column if not exists collections_completed integer not null default 0;

-- ---------------------------------------------------------------------------
-- Cycle swap agreements (requester + scheduled collector + admin)
-- ---------------------------------------------------------------------------
create table if not exists public.cycle_swap_requests (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  cycle_id uuid not null references public.cycles(id) on delete cascade,
  requester_id uuid not null references public.profiles(id),
  scheduled_recipient_id uuid not null references public.profiles(id),
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'cancelled')),
  scheduled_approved_at timestamptz,
  admin_approved_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists cycle_swap_requests_group_id_idx on public.cycle_swap_requests(group_id);
create index if not exists cycle_swap_requests_cycle_id_idx on public.cycle_swap_requests(cycle_id);

alter table public.cycle_swap_requests enable row level security;

create policy "Members can view swap requests in their groups"
  on public.cycle_swap_requests for select
  using (
    public.is_group_member(group_id, auth.uid())
    or exists (select 1 from public.groups g where g.id = group_id and g.admin_id = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.profile_is_verified(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select identity_status = 'verified' from public.profiles where id = p_user_id),
    false
  );
$$;

create or replace function public.sync_payout_slots_from_members(p_group_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.group_payout_slots where group_id = p_group_id;
  insert into public.group_payout_slots (group_id, position, user_id)
  select group_id, rotation_order, user_id
  from public.group_members
  where group_id = p_group_id
  order by rotation_order;
end;
$$;

-- ---------------------------------------------------------------------------
-- Set payout order (draft only; duplicate user_ids allowed)
-- ---------------------------------------------------------------------------
create or replace function public.set_group_payout_order(p_group_id uuid, p_user_ids uuid[])
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  g public.groups%rowtype;
  uid uuid;
  pos integer := 0;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;

  select * into g from public.groups where id = p_group_id;
  if not found then raise exception 'Group not found'; end if;
  if g.admin_id <> auth.uid() then raise exception 'Only the admin can set payout order'; end if;
  if g.status <> 'draft' then raise exception 'Payout order can only be changed while the group is in draft'; end if;
  if coalesce(array_length(p_user_ids, 1), 0) < 1 then raise exception 'Payout order cannot be empty'; end if;

  foreach uid in array p_user_ids loop
    if not exists (
      select 1 from public.group_members where group_id = p_group_id and user_id = uid
    ) then
      raise exception 'User is not a member of this group';
    end if;
  end loop;

  delete from public.group_payout_slots where group_id = p_group_id;

  pos := 0;
  foreach uid in array p_user_ids loop
    pos := pos + 1;
    insert into public.group_payout_slots (group_id, position, user_id)
    values (p_group_id, pos, uid);
  end loop;
end;
$$;

create or replace function public.add_group_payout_slot(p_group_id uuid, p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  g public.groups%rowtype;
  next_pos integer;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;

  select * into g from public.groups where id = p_group_id;
  if not found then raise exception 'Group not found'; end if;
  if g.admin_id <> auth.uid() then raise exception 'Only the admin can add payout slots'; end if;
  if g.status <> 'draft' then raise exception 'Only draft groups can be edited'; end if;

  if not exists (
    select 1 from public.group_members where group_id = p_group_id and user_id = p_user_id
  ) then
    raise exception 'User is not a member of this group';
  end if;

  select coalesce(max(position), 0) + 1 into next_pos
  from public.group_payout_slots where group_id = p_group_id;

  insert into public.group_payout_slots (group_id, position, user_id)
  values (p_group_id, next_pos, p_user_id);
end;
$$;

-- ---------------------------------------------------------------------------
-- Join with identity check + payout slot append
-- ---------------------------------------------------------------------------
create or replace function public.join_group_by_code(p_invite_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  g public.groups%rowtype;
  member_count integer;
  next_pos integer;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if not public.profile_is_verified(auth.uid()) then
    raise exception 'IDENTITY_NOT_VERIFIED';
  end if;

  select * into g from public.groups
  where invite_code = upper(trim(p_invite_code)) and status = 'draft';

  if not found then raise exception 'Invalid invite code or group already started'; end if;

  select count(*)::integer into member_count from public.group_members where group_id = g.id;
  if member_count >= g.max_members then raise exception 'Group is full'; end if;

  if exists (
    select 1 from public.group_members where group_id = g.id and user_id = auth.uid()
  ) then
    raise exception 'You are already in this group';
  end if;

  insert into public.group_members (group_id, user_id, rotation_order, role)
  values (g.id, auth.uid(), member_count + 1, 'member');

  select coalesce(max(position), 0) + 1 into next_pos
  from public.group_payout_slots where group_id = g.id;

  insert into public.group_payout_slots (group_id, position, user_id)
  values (g.id, next_pos, auth.uid());

  return g.id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Admin participation: keep payout slots in sync
-- ---------------------------------------------------------------------------
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
  next_pos integer;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;

  select * into g from public.groups where id = p_group_id;
  if not found then raise exception 'Group not found'; end if;
  if g.admin_id <> auth.uid() then raise exception 'Only the admin can change this'; end if;
  if g.status <> 'draft' then raise exception 'Cannot change after the group has started'; end if;

  select id into existing_id
  from public.group_members
  where group_id = p_group_id and user_id = auth.uid();

  if p_participates then
    if existing_id is not null then return; end if;

    select count(*)::integer into member_count from public.group_members where group_id = p_group_id;
    if member_count >= g.max_members then raise exception 'Group is full'; end if;

    insert into public.group_members (group_id, user_id, rotation_order, role)
    values (p_group_id, auth.uid(), member_count + 1, 'admin');

    select coalesce(max(position), 0) + 1 into next_pos
    from public.group_payout_slots where group_id = p_group_id;

    insert into public.group_payout_slots (group_id, position, user_id)
    values (p_group_id, next_pos, auth.uid());
    return;
  end if;

  if existing_id is null then return; end if;

  delete from public.group_members where id = existing_id;
  delete from public.group_payout_slots
  where group_id = p_group_id and user_id = auth.uid()
  and position = (
    select max(position) from public.group_payout_slots
    where group_id = p_group_id and user_id = auth.uid()
  );

  update public.group_members set rotation_order = rotation_order + 10000 where group_id = p_group_id;
  update public.group_members gm
  set rotation_order = sub.rn
  from (
    select id, row_number() over (order by rotation_order)::integer as rn
    from public.group_members where group_id = p_group_id
  ) sub where gm.id = sub.id;

  -- Renumber payout slots
  with ordered as (
    select id, row_number() over (order by position)::integer as rn
    from public.group_payout_slots where group_id = p_group_id
  )
  update public.group_payout_slots s
  set position = ordered.rn + 10000
  from ordered where s.id = ordered.id;

  with ordered as (
    select id, row_number() over (order by position)::integer as rn
    from public.group_payout_slots where group_id = p_group_id
  )
  update public.group_payout_slots s
  set position = ordered.rn
  from ordered where s.id = ordered.id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Start / advance cycles using payout slot count
-- ---------------------------------------------------------------------------
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

  due := now() + public.frequency_due_interval(g.frequency);

  insert into public.cycles (group_id, cycle_number, recipient_id, due_date, status)
  values (p_group_id, 1, recipient_user_id, due, 'collecting')
  returning id into new_cycle_id;

  insert into public.contributions (cycle_id, member_id, user_id, amount, status)
  select new_cycle_id, gm.id, gm.user_id, g.contribution_amount, 'pending'
  from public.group_members gm where gm.group_id = p_group_id;

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

  due := now() + public.frequency_due_interval(g.frequency);

  insert into public.cycles (group_id, cycle_number, recipient_id, due_date, status)
  values (p_group_id, next_num, recipient_user_id, due, 'collecting')
  returning id into new_cycle_id;

  insert into public.contributions (cycle_id, member_id, user_id, amount, status)
  select new_cycle_id, gm.id, gm.user_id, g.contribution_amount, 'pending'
  from public.group_members gm where gm.group_id = p_group_id;

  update public.groups set current_cycle = next_num, updated_at = now() where id = p_group_id;

  return new_cycle_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Record payment with method
-- ---------------------------------------------------------------------------
create or replace function public.record_contribution_payment(
  p_contribution_id uuid,
  p_payment_method text default 'cash',
  p_payment_note text default null
)
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
  method text;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;

  method := coalesce(nullif(trim(p_payment_method), ''), 'cash');
  if method not in ('cash', 'bank_transfer', 'pos', 'other', 'paystack') then
    raise exception 'Invalid payment method';
  end if;

  select * into c from public.contributions where id = p_contribution_id;
  if not found then raise exception 'Contribution not found'; end if;
  if c.status = 'paid' then return; end if;

  select * into cy from public.cycles where id = c.cycle_id;
  if not found then raise exception 'Cycle not found'; end if;

  select * into g from public.groups where id = cy.group_id;
  if not found then raise exception 'Group not found'; end if;
  if g.admin_id <> auth.uid() then raise exception 'Only admin can record payments'; end if;
  if cy.status not in ('collecting', 'open') then raise exception 'This cycle is not accepting payments'; end if;

  update public.contributions
  set
    status = 'paid',
    paid_at = now(),
    payment_method = method,
    payment_note = nullif(trim(p_payment_note), ''),
    paystack_reference = coalesce(
      paystack_reference,
      'manual_' || substr(replace(p_contribution_id::text, '-', ''), 1, 12)
    )
  where id = p_contribution_id;

  if not exists (
    select 1 from public.contributions where cycle_id = c.cycle_id and status <> 'paid'
  ) then
    update public.cycles set status = 'completed' where id = c.cycle_id;
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- Cycle swap: requester asks; scheduled collector + admin must approve
-- ---------------------------------------------------------------------------
create or replace function public.request_cycle_swap(p_cycle_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  cy public.cycles%rowtype;
  g public.groups%rowtype;
  req_id uuid;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;

  select * into cy from public.cycles where id = p_cycle_id;
  if not found then raise exception 'Cycle not found'; end if;
  if cy.status not in ('open', 'collecting') then raise exception 'This cycle cannot be swapped'; end if;
  if cy.recipient_id = auth.uid() then raise exception 'You are already the collector for this cycle'; end if;

  select * into g from public.groups where id = cy.group_id;
  if not public.is_group_member(g.id, auth.uid()) then raise exception 'Not a group member'; end if;

  if exists (
    select 1 from public.cycle_swap_requests
    where cycle_id = p_cycle_id and requester_id = auth.uid() and status = 'pending'
  ) then
    raise exception 'You already have a pending swap request for this cycle';
  end if;

  insert into public.cycle_swap_requests (
    group_id, cycle_id, requester_id, scheduled_recipient_id, status
  ) values (
    cy.group_id, p_cycle_id, auth.uid(), cy.recipient_id, 'pending'
  ) returning id into req_id;

  return req_id;
end;
$$;

create or replace function public.respond_cycle_swap(
  p_request_id uuid,
  p_role text,
  p_approve boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.cycle_swap_requests%rowtype;
  cy public.cycles%rowtype;
  g public.groups%rowtype;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;

  select * into r from public.cycle_swap_requests where id = p_request_id for update;
  if not found then raise exception 'Request not found'; end if;
  if r.status <> 'pending' then raise exception 'Request is no longer pending'; end if;

  select * into g from public.groups where id = r.group_id;
  select * into cy from public.cycles where id = r.cycle_id;

  if not p_approve then
    update public.cycle_swap_requests set status = 'rejected' where id = p_request_id;
    return;
  end if;

  if p_role = 'scheduled' then
    if auth.uid() <> r.scheduled_recipient_id then raise exception 'Only the scheduled collector can approve'; end if;
    update public.cycle_swap_requests set scheduled_approved_at = now() where id = p_request_id;
  elsif p_role = 'admin' then
    if auth.uid() <> g.admin_id then raise exception 'Only the admin can approve'; end if;
    update public.cycle_swap_requests set admin_approved_at = now() where id = p_request_id;
  else
    raise exception 'Invalid role';
  end if;

  select * into r from public.cycle_swap_requests where id = p_request_id;

  if r.scheduled_approved_at is not null and r.admin_approved_at is not null then
    update public.cycles set recipient_id = r.requester_id where id = r.cycle_id;
    update public.group_payout_slots
    set user_id = r.requester_id
    where group_id = r.group_id and position = cy.cycle_number;
    update public.cycle_swap_requests set status = 'approved' where id = p_request_id;
  end if;
end;
$$;

-- Grants
revoke all on function public.profile_is_verified(uuid) from public;
grant execute on function public.profile_is_verified(uuid) to authenticated;

revoke all on function public.set_group_payout_order(uuid, uuid[]) from public;
grant execute on function public.set_group_payout_order(uuid, uuid[]) to authenticated;

revoke all on function public.add_group_payout_slot(uuid, uuid) from public;
grant execute on function public.add_group_payout_slot(uuid, uuid) to authenticated;

revoke all on function public.join_group_by_code(text) from public;
grant execute on function public.join_group_by_code(text) to authenticated;

revoke all on function public.request_cycle_swap(uuid) from public;
grant execute on function public.request_cycle_swap(uuid) to authenticated;

revoke all on function public.respond_cycle_swap(uuid, text, boolean) from public;
grant execute on function public.respond_cycle_swap(uuid, text, boolean) to authenticated;

revoke all on function public.record_contribution_payment(uuid, text, text) from public;
grant execute on function public.record_contribution_payment(uuid, text, text) to authenticated;

-- Overload compatibility: old single-arg calls default method to cash
create or replace function public.record_contribution_payment(p_contribution_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  select public.record_contribution_payment(p_contribution_id, 'cash', null);
$$;

revoke all on function public.record_contribution_payment(uuid) from public;
grant execute on function public.record_contribution_payment(uuid) to authenticated;
