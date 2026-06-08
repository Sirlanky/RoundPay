-- Admin platform: group ops extensions, plans shell, dashboard RPC.

alter table public.groups
  add column if not exists notes text,
  add column if not exists penalty_amount integer not null default 0,
  add column if not exists penalty_grace_days integer not null default 0,
  add column if not exists archived_at timestamptz,
  add column if not exists settings jsonb not null default '{}'::jsonb;

alter table public.contributions
  add column if not exists receipt_url text,
  add column if not exists confirmed_by uuid references public.profiles(id),
  add column if not exists confirmed_at timestamptz,
  add column if not exists notes text;

alter table public.group_members
  add column if not exists status text not null default 'active',
  add column if not exists removed_at timestamptz,
  add column if not exists late_payment_count integer not null default 0,
  add column if not exists on_time_payment_count integer not null default 0;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'group_members_status_check'
  ) then
    alter table public.group_members
      add constraint group_members_status_check
      check (status in ('active', 'removed', 'suspended'));
  end if;
end $$;

create table if not exists public.group_notes (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.admin_plans (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  max_groups integer not null,
  max_members_per_group integer not null,
  features jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

insert into public.admin_plans (code, name, max_groups, max_members_per_group, features)
values
  ('free', 'Free', 1, 20, '{"reminders":false,"reports":false,"exports":false,"analytics":false}'::jsonb),
  ('pro', 'Pro', 5, 50, '{"reminders":true,"reports":true,"exports":true,"analytics":true}'::jsonb),
  ('premium', 'Premium', 999, 999, '{"reminders":true,"reports":true,"exports":true,"analytics":true}'::jsonb)
on conflict (code) do nothing;

create table if not exists public.admin_subscriptions (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references public.profiles(id) on delete cascade,
  plan_id uuid not null references public.admin_plans(id),
  status text not null default 'active',
  started_at timestamptz not null default now(),
  expires_at timestamptz,
  unique (admin_id)
);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'admin_subscriptions_status_check'
  ) then
    alter table public.admin_subscriptions
      add constraint admin_subscriptions_status_check
      check (status in ('active', 'trialing', 'cancelled'));
  end if;
end $$;

create table if not exists public.reminder_templates (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references public.profiles(id) on delete cascade,
  group_id uuid references public.groups(id) on delete cascade,
  channel text not null,
  trigger text not null,
  subject text,
  body text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'reminder_templates_channel_check'
  ) then
    alter table public.reminder_templates
      add constraint reminder_templates_channel_check
      check (channel in ('sms', 'whatsapp', 'in_app'));
  end if;
end $$;

create or replace function public.archive_group(p_group_id uuid)
returns public.groups
language plpgsql
security definer
set search_path = public
as $$
declare
  g public.groups%rowtype;
begin
  select * into g from public.groups where id = p_group_id;
  if not found then
    raise exception 'Group not found';
  end if;
  if g.admin_id <> auth.uid() then
    raise exception 'Only the admin can archive this group';
  end if;

  update public.groups
  set archived_at = now(), updated_at = now()
  where id = p_group_id
  returning * into g;

  return g;
end;
$$;

revoke all on function public.archive_group(uuid) from public;
grant execute on function public.archive_group(uuid) to authenticated;

create or replace function public.get_admin_dashboard_stats(p_admin_id uuid default auth.uid())
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  result jsonb;
begin
  if p_admin_id is null then
    raise exception 'Not authenticated';
  end if;
  if p_admin_id <> auth.uid() then
    raise exception 'Not authorized';
  end if;

  select jsonb_build_object(
    'total_groups', (
      select count(*)::int from public.groups g
      where g.admin_id = p_admin_id and g.archived_at is null
    ),
    'active_groups', (
      select count(*)::int from public.groups g
      where g.admin_id = p_admin_id and g.status = 'active' and g.archived_at is null
    ),
    'total_members', (
      select count(distinct gm.user_id)::int
      from public.group_members gm
      join public.groups g on g.id = gm.group_id
      where g.admin_id = p_admin_id and g.archived_at is null and gm.status = 'active'
    ),
    'contributions_received', (
      select coalesce(sum(c.amount), 0)::bigint
      from public.contributions c
      join public.cycles cy on cy.id = c.cycle_id
      join public.groups g on g.id = cy.group_id
      where g.admin_id = p_admin_id and c.status = 'paid' and g.archived_at is null
    ),
    'contributions_outstanding', (
      select coalesce(sum(c.amount), 0)::bigint
      from public.contributions c
      join public.cycles cy on cy.id = c.cycle_id
      join public.groups g on g.id = cy.group_id
      where g.admin_id = p_admin_id and c.status = 'pending'
        and cy.status in ('open', 'collecting')
        and g.archived_at is null
    ),
    'upcoming_payouts', (
      select count(*)::int
      from public.cycles cy
      join public.groups g on g.id = cy.group_id
      where g.admin_id = p_admin_id
        and g.status = 'active'
        and g.archived_at is null
        and cy.status in ('open', 'collecting', 'completed')
    ),
    'pending_confirmations', (
      select count(*)::int
      from public.contributions c
      join public.cycles cy on cy.id = c.cycle_id
      join public.groups g on g.id = cy.group_id
      where g.admin_id = p_admin_id and c.status = 'pending' and g.archived_at is null
    )
  ) into result;

  return result;
end;
$$;

revoke all on function public.get_admin_dashboard_stats(uuid) from public;
grant execute on function public.get_admin_dashboard_stats(uuid) to authenticated;

alter table public.group_notes enable row level security;
alter table public.admin_plans enable row level security;
alter table public.admin_subscriptions enable row level security;
alter table public.reminder_templates enable row level security;

create policy "group_notes_admin" on public.group_notes for all
  using (exists (select 1 from public.groups g where g.id = group_id and g.admin_id = auth.uid()));

create policy "admin_plans_read" on public.admin_plans for select using (true);

create policy "admin_subscriptions_own" on public.admin_subscriptions for select
  using (admin_id = auth.uid());

create policy "reminder_templates_own" on public.reminder_templates for all
  using (admin_id = auth.uid());
