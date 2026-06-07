-- In-app notifications (Phase 1)

create table if not exists public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  group_id uuid references public.groups(id) on delete cascade,
  type text not null,
  title text not null,
  message text not null,
  related_entity_id uuid,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_created_idx
  on public.notifications (user_id, created_at desc);

create index if not exists notifications_user_unread_idx
  on public.notifications (user_id)
  where read_at is null;

alter table public.notifications enable row level security;

drop policy if exists "Users can view own notifications" on public.notifications;
create policy "Users can view own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

drop policy if exists "Users can update own notifications" on public.notifications;
create policy "Users can update own notifications"
  on public.notifications for update
  using (auth.uid() = user_id);

-- Helpers
create or replace function public.format_naira_amount(amount integer)
returns text
language sql
immutable
as $$
  select '₦' || trim(to_char(amount, 'FM999,999,999,990'));
$$;

create or replace function public.create_notification(
  p_user_id uuid,
  p_group_id uuid,
  p_type text,
  p_title text,
  p_message text,
  p_related_entity_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
begin
  if p_user_id is null then
    return null;
  end if;

  insert into public.notifications (user_id, group_id, type, title, message, related_entity_id)
  values (p_user_id, p_group_id, p_type, p_title, p_message, p_related_entity_id)
  returning id into new_id;

  return new_id;
end;
$$;

revoke all on function public.create_notification(uuid, uuid, text, text, text, uuid) from public;
grant execute on function public.create_notification(uuid, uuid, text, text, text, uuid) to service_role;

-- Member joined
create or replace function public.notify_on_member_joined()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  g public.groups%rowtype;
  joiner_name text;
  member record;
begin
  select * into g from public.groups where id = new.group_id;
  if not found then
    return new;
  end if;

  select coalesce(nullif(trim(full_name), ''), 'A member')
  into joiner_name
  from public.profiles
  where id = new.user_id;

  if g.admin_id is distinct from new.user_id then
    perform public.create_notification(
      g.admin_id,
      new.group_id,
      'member_joined',
      'New member joined',
      joiner_name || ' joined "' || g.name || '".',
      new.id
    );
  end if;

  for member in
    select gm.user_id
    from public.group_members gm
    where gm.group_id = new.group_id
      and gm.user_id not in (new.user_id, g.admin_id)
  loop
    perform public.create_notification(
      member.user_id,
      new.group_id,
      'member_joined',
      'New member joined',
      joiner_name || ' joined "' || g.name || '".',
      new.id
    );
  end loop;

  perform public.create_notification(
    new.user_id,
    new.group_id,
    'group_joined',
    'You joined a group',
    'Welcome to "' || g.name || '".',
    new.group_id
  );

  return new;
end;
$$;

drop trigger if exists group_members_notify_joined on public.group_members;
create trigger group_members_notify_joined
  after insert on public.group_members
  for each row execute function public.notify_on_member_joined();

-- Contribution paid
create or replace function public.notify_on_contribution_paid()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  cy public.cycles%rowtype;
  g public.groups%rowtype;
  payer_name text;
begin
  if new.status <> 'paid' or old.status = 'paid' then
    return new;
  end if;

  select * into cy from public.cycles where id = new.cycle_id;
  select * into g from public.groups where id = cy.group_id;

  select coalesce(nullif(trim(full_name), ''), 'A member')
  into payer_name
  from public.profiles
  where id = new.user_id;

  perform public.create_notification(
    new.user_id,
    g.id,
    'payment_confirmed',
    'Payment confirmed',
    'Your ' || public.format_naira_amount(new.amount) || ' contribution for "' || g.name || '" was confirmed.',
    new.id
  );

  if g.admin_id is distinct from new.user_id then
    perform public.create_notification(
      g.admin_id,
      g.id,
      'payment_received',
      'Contribution received',
      payer_name || ' paid ' || public.format_naira_amount(new.amount) || ' for "' || g.name || '".',
      new.id
    );
  end if;

  return new;
end;
$$;

drop trigger if exists contributions_notify_paid on public.contributions;
create trigger contributions_notify_paid
  after update on public.contributions
  for each row execute function public.notify_on_contribution_paid();

-- Payout completed
create or replace function public.notify_on_payout_completed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  cy public.cycles%rowtype;
  g public.groups%rowtype;
  recipient_name text;
  member record;
begin
  if new.status <> 'completed' then
    return new;
  end if;

  if tg_op = 'UPDATE' and old.status = 'completed' then
    return new;
  end if;

  select * into cy from public.cycles where id = new.cycle_id;
  select * into g from public.groups where id = cy.group_id;

  select coalesce(nullif(trim(full_name), ''), 'A member')
  into recipient_name
  from public.profiles
  where id = new.recipient_id;

  perform public.create_notification(
    new.recipient_id,
    cy.group_id,
    'payout_completed',
    'Payout completed',
    'You received ' || public.format_naira_amount(new.amount) || ' from "' || g.name || '" (cycle ' || cy.cycle_number || ').',
    new.id
  );

  for member in
    select gm.user_id
    from public.group_members gm
    where gm.group_id = cy.group_id
      and gm.user_id <> new.recipient_id
  loop
    perform public.create_notification(
      member.user_id,
      cy.group_id,
      'payout_completed',
      'Payout completed',
      recipient_name || ' received the cycle ' || cy.cycle_number || ' payout for "' || g.name || '".',
      new.id
    );
  end loop;

  return new;
end;
$$;

drop trigger if exists payouts_notify_completed on public.payouts;
create trigger payouts_notify_completed
  after insert or update on public.payouts
  for each row execute function public.notify_on_payout_completed();

-- Realtime (idempotent — skip if already added)
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;

revoke all on function public.create_notification(uuid, uuid, text, text, text, uuid) from public;
revoke all on function public.create_notification(uuid, uuid, text, text, text, uuid) from anon;
revoke all on function public.create_notification(uuid, uuid, text, text, text, uuid) from authenticated;
grant execute on function public.create_notification(uuid, uuid, text, text, text, uuid) to service_role;

notify pgrst, 'reload schema';
