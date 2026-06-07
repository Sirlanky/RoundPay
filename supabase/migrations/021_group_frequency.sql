-- Contribution frequency options: daily, weekly, monthly.

alter table public.groups drop constraint if exists groups_frequency_check;

update public.groups set frequency = 'weekly' where frequency = 'biweekly';

alter table public.groups
  add constraint groups_frequency_check
  check (frequency in ('daily', 'weekly', 'monthly'));

create or replace function public.frequency_due_interval(p_frequency text)
returns interval
language sql
immutable
as $$
  select case p_frequency
    when 'daily' then interval '1 day'
    when 'weekly' then interval '7 days'
    when 'monthly' then interval '1 month'
    else interval '7 days'
  end;
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
  new_cycle_id uuid;
  recipient_user_id uuid;
  due timestamptz;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select * into g from public.groups where id = p_group_id for update;
  if not found then
    raise exception 'Group not found';
  end if;
  if g.admin_id <> auth.uid() then
    raise exception 'Only the admin can start this group';
  end if;
  if g.status <> 'draft' then
    raise exception 'Group cannot be started';
  end if;

  select count(*)::integer into member_count from public.group_members where group_id = p_group_id;
  if member_count < g.max_members then
    raise exception 'All % members must join before starting', g.max_members;
  end if;

  select user_id into recipient_user_id
  from public.group_members
  where group_id = p_group_id
  order by rotation_order
  limit 1;

  if recipient_user_id is null then
    raise exception 'No members in group';
  end if;

  due := now() + public.frequency_due_interval(g.frequency);

  insert into public.cycles (group_id, cycle_number, recipient_id, due_date, status)
  values (p_group_id, 1, recipient_user_id, due, 'collecting')
  returning id into new_cycle_id;

  insert into public.contributions (cycle_id, member_id, user_id, amount, status)
  select new_cycle_id, gm.id, gm.user_id, g.contribution_amount, 'pending'
  from public.group_members gm
  where gm.group_id = p_group_id;

  update public.groups
  set status = 'active', current_cycle = 1, updated_at = now()
  where id = p_group_id;

  return new_cycle_id;
end;
$$;

create or replace function public.advance_cycle(p_group_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  g public.groups%rowtype;
  cy public.cycles%rowtype;
  next_num integer;
  recipient_user_id uuid;
  new_cycle_id uuid;
  due timestamptz;
  member_count integer;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select * into g from public.groups where id = p_group_id for update;
  if not found then
    raise exception 'Group not found';
  end if;

  if g.admin_id <> auth.uid() then
    raise exception 'Only admin can advance cycle';
  end if;

  select * into cy from public.cycles
  where group_id = p_group_id and cycle_number = g.current_cycle;

  if not found or cy.status <> 'paid_out' then
    raise exception 'Current cycle must be paid out before advancing';
  end if;

  select count(*)::integer into member_count
  from public.group_members
  where group_id = p_group_id;

  next_num := g.current_cycle + 1;

  if next_num > member_count then
    update public.groups set status = 'completed', updated_at = now() where id = p_group_id;
    return null;
  end if;

  select user_id into recipient_user_id
  from public.group_members
  where group_id = p_group_id and rotation_order = next_num;

  if recipient_user_id is null then
    raise exception 'Could not find collector for next cycle';
  end if;

  due := now() + public.frequency_due_interval(g.frequency);

  insert into public.cycles (group_id, cycle_number, recipient_id, due_date, status)
  values (p_group_id, next_num, recipient_user_id, due, 'collecting')
  returning id into new_cycle_id;

  insert into public.contributions (cycle_id, member_id, user_id, amount, status)
  select new_cycle_id, gm.id, gm.user_id, g.contribution_amount, 'pending'
  from public.group_members gm
  where gm.group_id = p_group_id;

  update public.groups
  set current_cycle = next_num, updated_at = now()
  where id = p_group_id;

  return new_cycle_id;
end;
$$;

revoke all on function public.frequency_due_interval(text) from public;
grant execute on function public.frequency_due_interval(text) to authenticated;

revoke all on function public.start_group(uuid) from public;
grant execute on function public.start_group(uuid) to authenticated;

revoke all on function public.advance_cycle(uuid) from public;
grant execute on function public.advance_cycle(uuid) to authenticated;
