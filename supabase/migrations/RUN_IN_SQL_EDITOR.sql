-- Paste this ENTIRE file into Supabase → SQL Editor → Run once.
-- Safe to re-run (idempotent). Fixes guest profile + create group.

-- === 1. Profile setup (run this even if other steps failed before) ===
create or replace function public.ensure_my_profile()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  user_email text;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  select email into user_email from auth.users where id = uid;

  insert into public.profiles (id, email, full_name)
  values (uid, user_email, null)
  on conflict (id) do nothing;
end;
$$;

revoke all on function public.ensure_my_profile() from public;
grant execute on function public.ensure_my_profile() to authenticated;

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

-- === 2. Join preview (optional; skip errors if you already ran 002) ===
drop policy if exists "Authenticated can preview draft groups by invite code" on public.groups;
create policy "Authenticated can preview draft groups by invite code"
  on public.groups for select
  to authenticated
  using (status = 'draft');

-- === 3. Admin can organize without contributing ===
create or replace function public.is_group_member(gid uuid, uid uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.group_members
    where group_id = gid and user_id = uid
  ) or exists (
    select 1 from public.groups
    where id = gid and admin_id = uid
  );
$$;

drop policy if exists "Users can leave draft groups" on public.group_members;
create policy "Users can leave draft groups"
  on public.group_members for delete
  using (
    auth.uid() = user_id
    and exists (
      select 1 from public.groups g
      where g.id = group_id and g.status = 'draft'
    )
  );

-- === 4. Start group only when roster is full ===
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

  if g.frequency = 'weekly' then
    due := now() + interval '7 days';
  else
    due := now() + interval '1 month';
  end if;

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

-- === 5. Admin step in / step out of rotation ===
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
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select * into g from public.groups where id = p_group_id;
  if not found then
    raise exception 'Group not found';
  end if;
  if g.admin_id <> auth.uid() then
    raise exception 'Only the admin can change this';
  end if;
  if g.status <> 'draft' then
    raise exception 'Cannot change after the group has started';
  end if;

  select id into existing_id
  from public.group_members
  where group_id = p_group_id and user_id = auth.uid();

  if p_participates then
    if existing_id is not null then
      return;
    end if;

    select count(*)::integer into member_count
    from public.group_members
    where group_id = p_group_id;

    if member_count >= g.max_members then
      raise exception 'Group is full';
    end if;

    insert into public.group_members (group_id, user_id, rotation_order, role)
    values (p_group_id, auth.uid(), member_count + 1, 'admin');
    return;
  end if;

  if existing_id is null then
    return;
  end if;

  delete from public.group_members where id = existing_id;

  update public.group_members
  set rotation_order = rotation_order + 10000
  where group_id = p_group_id;

  update public.group_members gm
  set rotation_order = sub.rn
  from (
    select id, row_number() over (order by rotation_order)::integer as rn
    from public.group_members
    where group_id = p_group_id
  ) sub
  where gm.id = sub.id;
end;
$$;

revoke all on function public.set_admin_participation(uuid, boolean) from public;
grant execute on function public.set_admin_participation(uuid, boolean) to authenticated;

-- === 6. Record who paid (manual or after Paystack) ===
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

-- === 7. Record payout without Paystack (manual / testing) ===
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

-- === 8. Next cycle creates payment rows for every member ===
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

  if g.frequency = 'weekly' then
    due := now() + interval '7 days';
  else
    due := now() + interval '1 month';
  end if;

  insert into public.cycles (group_id, cycle_number, recipient_id, due_date, status)
  values (p_group_id, next_num, recipient_user_id, due, 'collecting')
  returning id into new_cycle_id;

  insert into public.contributions (cycle_id, member_id, user_id, amount, status)
  select new_cycle_id, gm.id, gm.user_id, g.contribution_amount, 'pending'
  from public.group_members gm
  where gm.group_id = p_group_id
  order by gm.rotation_order;

  update public.groups
  set current_cycle = next_num, updated_at = now()
  where id = p_group_id;

  return new_cycle_id;
end;
$$;

revoke all on function public.advance_cycle(uuid) from public;
grant execute on function public.advance_cycle(uuid) to authenticated;

-- Backfill: fix cycle 2+ that started without payment rows
insert into public.contributions (cycle_id, member_id, user_id, amount, status)
select c.id, gm.id, gm.user_id, g.contribution_amount, 'pending'
from public.cycles c
join public.groups g on g.id = c.group_id
join public.group_members gm on gm.group_id = g.id
where c.status in ('collecting', 'open')
  and not exists (
    select 1 from public.contributions co
    where co.cycle_id = c.id and co.member_id = gm.id
  );

notify pgrst, 'reload schema';

-- === 9. Delete draft groups (admin only) ===
create or replace function public.delete_draft_group(p_group_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  g public.groups%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select * into g from public.groups where id = p_group_id;

  if not found then
    raise exception 'Group not found';
  end if;

  if g.admin_id <> auth.uid() then
    raise exception 'Only the admin can delete this group';
  end if;

  if g.status <> 'draft' then
    raise exception 'Only draft groups can be deleted';
  end if;

  delete from public.groups where id = p_group_id;
end;
$$;

revoke all on function public.delete_draft_group(uuid) from public;
grant execute on function public.delete_draft_group(uuid) to authenticated;

drop policy if exists "Admin can delete draft groups" on public.groups;
create policy "Admin can delete draft groups"
  on public.groups for delete
  to authenticated
  using (admin_id = auth.uid() and status = 'draft');

notify pgrst, 'reload schema';

-- === 11. Profile details (first/middle/last name, DOB, gender) ===
-- Full SQL: supabase/migrations/017_profile_details.sql

alter table public.profiles
  add column if not exists first_name text,
  add column if not exists middle_name text,
  add column if not exists last_name text,
  add column if not exists date_of_birth date,
  add column if not exists gender text;

alter table public.profiles drop constraint if exists profiles_gender_check;
alter table public.profiles
  add constraint profiles_gender_check
  check (gender is null or gender in ('male', 'female', 'other', 'prefer_not_to_say'));

update public.profiles
set first_name = split_part(trim(full_name), ' ', 1)
where full_name is not null
  and nullif(trim(full_name), '') is not null
  and first_name is null;

notify pgrst, 'reload schema';

-- === 12. Push notification preferences ===
-- Full SQL: supabase/migrations/018_push_preferences.sql

alter table public.profiles
  add column if not exists push_enabled boolean not null default true;

notify pgrst, 'reload schema';

-- === 13. Reminder preferences ===
-- Full SQL: supabase/migrations/019_reminder_preferences.sql

alter table public.profiles
  add column if not exists reminders_enabled boolean not null default true,
  add column if not exists reminder_contributions boolean not null default true,
  add column if not exists reminder_overdue boolean not null default true,
  add column if not exists reminder_payouts boolean not null default true,
  add column if not exists reminder_hour smallint not null default 9;

alter table public.profiles drop constraint if exists profiles_reminder_hour_check;
alter table public.profiles
  add constraint profiles_reminder_hour_check
  check (reminder_hour >= 6 and reminder_hour <= 21);

notify pgrst, 'reload schema';

-- === 14. Profile avatar (photo) ===
-- Full SQL: supabase/migrations/020_profile_avatar.sql

alter table public.profiles
  add column if not exists avatar_url text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Avatar images are publicly accessible" on storage.objects;
create policy "Avatar images are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "Users can upload own avatar" on storage.objects;
create policy "Users can upload own avatar"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Users can update own avatar" on storage.objects;
create policy "Users can update own avatar"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Users can delete own avatar" on storage.objects;
create policy "Users can delete own avatar"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

notify pgrst, 'reload schema';
