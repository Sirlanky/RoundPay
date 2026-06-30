-- Block cycle swap for members who already collected in this circle.
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
  mem public.group_members%rowtype;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;

  select * into cy from public.cycles where id = p_cycle_id;
  if not found then raise exception 'Cycle not found'; end if;
  if cy.status not in ('open', 'collecting') then raise exception 'This cycle cannot be swapped'; end if;
  if cy.recipient_id = auth.uid() then raise exception 'You are already the collector for this cycle'; end if;

  select * into g from public.groups where id = cy.group_id;
  if not public.is_group_member(g.id, auth.uid()) then raise exception 'Not a group member'; end if;

  select * into mem
  from public.group_members
  where group_id = g.id and user_id = auth.uid();

  if not found then raise exception 'Not a group member'; end if;
  if mem.has_collected then
    raise exception 'You already collected in this circle — swap is only for members who have not collected yet';
  end if;

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

revoke all on function public.request_cycle_swap(uuid) from public;
grant execute on function public.request_cycle_swap(uuid) to authenticated;
