-- Direct messaging between members who share a savings group

create table if not exists public.direct_messages (
  id uuid primary key default uuid_generate_v4(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (length(btrim(body)) > 0),
  read_at timestamptz,
  created_at timestamptz not null default now(),
  constraint direct_messages_distinct_users check (sender_id <> recipient_id)
);

create index if not exists direct_messages_pair_idx
  on public.direct_messages (sender_id, recipient_id, created_at desc);

create index if not exists direct_messages_recipient_idx
  on public.direct_messages (recipient_id, created_at desc);

create index if not exists direct_messages_recipient_unread_idx
  on public.direct_messages (recipient_id)
  where read_at is null;

alter table public.direct_messages enable row level security;

-- Two users may message each other only if they currently share a group.
create or replace function public.users_share_group(a uuid, b uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.group_members gm1
    join public.group_members gm2 on gm1.group_id = gm2.group_id
    where gm1.user_id = a and gm2.user_id = b
  );
$$;

revoke all on function public.users_share_group(uuid, uuid) from public;
grant execute on function public.users_share_group(uuid, uuid) to authenticated;

drop policy if exists "Members can read own conversations" on public.direct_messages;
create policy "Members can read own conversations"
  on public.direct_messages for select
  using (auth.uid() = sender_id or auth.uid() = recipient_id);

drop policy if exists "Members can send to co-members" on public.direct_messages;
create policy "Members can send to co-members"
  on public.direct_messages for insert
  with check (
    auth.uid() = sender_id
    and public.users_share_group(sender_id, recipient_id)
  );

-- Recipients may update their received messages (used to stamp read_at).
drop policy if exists "Recipients can mark messages read" on public.direct_messages;
create policy "Recipients can mark messages read"
  on public.direct_messages for update
  using (auth.uid() = recipient_id)
  with check (auth.uid() = recipient_id);

-- Latest message + unread count per conversation partner for the current user.
create or replace function public.get_conversations()
returns table (
  other_user_id uuid,
  full_name text,
  avatar_url text,
  last_body text,
  last_at timestamptz,
  last_sender_id uuid,
  unread_count integer
)
language sql
stable
security definer
set search_path = public
as $$
  with me as (select auth.uid() as uid),
  convo as (
    select
      case when dm.sender_id = (select uid from me) then dm.recipient_id else dm.sender_id end as other_id,
      dm.body,
      dm.created_at,
      dm.read_at,
      dm.recipient_id,
      dm.sender_id
    from public.direct_messages dm
    where dm.sender_id = (select uid from me) or dm.recipient_id = (select uid from me)
  ),
  latest as (
    select distinct on (other_id) other_id, body, created_at, sender_id
    from convo
    order by other_id, created_at desc
  ),
  unread as (
    select other_id, count(*)::int as cnt
    from convo
    where read_at is null and recipient_id = (select uid from me)
    group by other_id
  )
  select
    l.other_id,
    p.full_name,
    p.avatar_url,
    l.body,
    l.created_at,
    l.sender_id,
    coalesce(u.cnt, 0)
  from latest l
  join public.profiles p on p.id = l.other_id
  left join unread u on u.other_id = l.other_id
  order by l.created_at desc;
$$;

revoke all on function public.get_conversations() from public;
grant execute on function public.get_conversations() to authenticated;

-- Groups that both the current user and the given user belong to.
create or replace function public.get_shared_groups(p_other uuid)
returns table (id uuid, name text, status text)
language sql
stable
security definer
set search_path = public
as $$
  select g.id, g.name, g.status
  from public.groups g
  where exists (
      select 1 from public.group_members gm
      where gm.group_id = g.id and gm.user_id = auth.uid()
    )
    and exists (
      select 1 from public.group_members gm
      where gm.group_id = g.id and gm.user_id = p_other
    )
  order by g.created_at desc;
$$;

revoke all on function public.get_shared_groups(uuid) from public;
grant execute on function public.get_shared_groups(uuid) to authenticated;

-- Realtime (idempotent — skip if already added)
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'direct_messages'
  ) then
    alter publication supabase_realtime add table public.direct_messages;
  end if;
end $$;

notify pgrst, 'reload schema';
