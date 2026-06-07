-- Identity verification for group admins.

alter table public.profiles
  add column if not exists identity_status text not null default 'not_started',
  add column if not exists identity_submitted_at timestamptz,
  add column if not exists identity_verified_at timestamptz;

alter table public.profiles drop constraint if exists profiles_identity_status_check;
alter table public.profiles
  add constraint profiles_identity_status_check
  check (identity_status in ('not_started', 'in_review', 'verified'));

comment on column public.profiles.identity_status is
  'KYC status. Only verified users may create groups as admin.';

create or replace function public.guard_profile_identity_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' and new.identity_status is distinct from old.identity_status then
    if auth.uid() = new.id and new.identity_status = 'verified' then
      raise exception 'Identity verification must be approved by RoundPay';
    end if;
    if auth.uid() = new.id and old.identity_status = 'verified' and new.identity_status <> 'verified' then
      raise exception 'Verified identity cannot be removed by the user';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_guard_identity_status on public.profiles;
create trigger profiles_guard_identity_status
  before update on public.profiles
  for each row execute function public.guard_profile_identity_status();

create or replace function public.require_verified_group_admin(p_admin_id uuid)
returns void
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  status text;
begin
  select identity_status into status from public.profiles where id = p_admin_id;
  if status is null then
    raise exception 'ADMIN_IDENTITY_REQUIRED';
  end if;
  if status = 'in_review' then
    raise exception 'ADMIN_IDENTITY_IN_REVIEW';
  end if;
  if status <> 'verified' then
    raise exception 'ADMIN_IDENTITY_REQUIRED';
  end if;
end;
$$;

create or replace function public.check_verified_admin_before_group_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.require_verified_group_admin(new.admin_id);
  return new;
end;
$$;

drop trigger if exists groups_require_verified_admin on public.groups;
create trigger groups_require_verified_admin
  before insert on public.groups
  for each row execute function public.check_verified_admin_before_group_insert();

drop policy if exists "Anyone authenticated can create groups" on public.groups;
drop policy if exists "Verified users can create groups" on public.groups;

create policy "Verified users can create groups"
  on public.groups for insert
  with check (
    auth.uid() = admin_id
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.identity_status = 'verified'
    )
  );

create or replace function public.submit_identity_verification()
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  p public.profiles%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select * into p from public.profiles where id = auth.uid() for update;
  if not found then
    raise exception 'Profile not found';
  end if;

  if p.identity_status = 'verified' then
    return p;
  end if;

  if p.identity_status = 'in_review' then
    raise exception 'Identity verification already submitted';
  end if;

  update public.profiles
  set
    identity_status = 'in_review',
    identity_submitted_at = now(),
    updated_at = now()
  where id = auth.uid()
  returning * into p;

  return p;
end;
$$;

revoke all on function public.submit_identity_verification() from public;
grant execute on function public.submit_identity_verification() to authenticated;

revoke all on function public.require_verified_group_admin(uuid) from public;
grant execute on function public.require_verified_group_admin(uuid) to authenticated;

-- Belt-and-suspenders: starting a group also requires a verified admin.
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

  perform public.require_verified_group_admin(auth.uid());

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

revoke all on function public.start_group(uuid) from public;
grant execute on function public.start_group(uuid) to authenticated;
