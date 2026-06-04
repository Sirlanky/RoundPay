-- Ajo/Esusu schema with RLS

create extension if not exists "uuid-ossp";

-- Profiles (extends auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  email text,
  bank_code text,
  bank_name text,
  account_number text,
  account_name text,
  paystack_recipient_code text,
  expo_push_token text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Ajo groups
create table public.groups (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  contribution_amount integer not null check (contribution_amount > 0),
  frequency text not null check (frequency in ('weekly', 'monthly')),
  max_members integer not null default 10 check (max_members >= 2),
  admin_fee_percent numeric(5,2) not null default 0 check (admin_fee_percent >= 0 and admin_fee_percent <= 100),
  status text not null default 'draft' check (status in ('draft', 'active', 'completed')),
  current_cycle integer not null default 0,
  admin_id uuid not null references public.profiles(id),
  invite_code text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index groups_invite_code_idx on public.groups(invite_code);
create index groups_admin_id_idx on public.groups(admin_id);

-- Group members
create table public.group_members (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  rotation_order integer not null,
  role text not null default 'member' check (role in ('admin', 'member')),
  has_collected boolean not null default false,
  joined_at timestamptz not null default now(),
  unique (group_id, user_id),
  unique (group_id, rotation_order)
);

create index group_members_group_id_idx on public.group_members(group_id);
create index group_members_user_id_idx on public.group_members(user_id);

-- Cycles
create table public.cycles (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid not null references public.groups(id) on delete cascade,
  cycle_number integer not null,
  recipient_id uuid not null references public.profiles(id),
  due_date timestamptz not null,
  status text not null default 'open' check (status in ('open', 'collecting', 'completed', 'paid_out')),
  created_at timestamptz not null default now(),
  unique (group_id, cycle_number)
);

create index cycles_group_id_idx on public.cycles(group_id);

-- Contributions
create table public.contributions (
  id uuid primary key default uuid_generate_v4(),
  cycle_id uuid not null references public.cycles(id) on delete cascade,
  member_id uuid not null references public.group_members(id) on delete cascade,
  user_id uuid not null references public.profiles(id),
  amount integer not null,
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed')),
  paystack_reference text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  unique (cycle_id, member_id)
);

create index contributions_cycle_id_idx on public.contributions(cycle_id);

-- Payouts
create table public.payouts (
  id uuid primary key default uuid_generate_v4(),
  cycle_id uuid not null references public.cycles(id) on delete cascade unique,
  recipient_id uuid not null references public.profiles(id),
  amount integer not null,
  status text not null default 'pending' check (status in ('pending', 'processing', 'completed', 'failed')),
  paystack_transfer_code text,
  created_at timestamptz not null default now()
);

-- Payment audit log (manual/offline payments)
create table public.payment_audit_log (
  id uuid primary key default uuid_generate_v4(),
  contribution_id uuid not null references public.contributions(id),
  marked_by uuid not null references public.profiles(id),
  note text,
  created_at timestamptz not null default now()
);

-- Helper: is user a member of group
create or replace function public.is_group_member(gid uuid, uid uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.group_members
    where group_id = gid and user_id = uid
  );
$$;

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, phone, full_name)
  values (
    new.id,
    new.email,
    new.phone,
    coalesce(new.raw_user_meta_data->>'full_name', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Updated_at trigger
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger groups_updated_at before update on public.groups
  for each row execute function public.set_updated_at();

-- RLS
alter table public.profiles enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.cycles enable row level security;
alter table public.contributions enable row level security;
alter table public.payouts enable row level security;
alter table public.payment_audit_log enable row level security;

-- Profiles policies
create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);
create policy "Users can view profiles in same groups"
  on public.profiles for select using (
    exists (
      select 1 from public.group_members gm1
      join public.group_members gm2 on gm1.group_id = gm2.group_id
      where gm1.user_id = auth.uid() and gm2.user_id = profiles.id
    )
  );
create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- Groups policies
create policy "Members can view their groups"
  on public.groups for select using (public.is_group_member(id, auth.uid()));
create policy "Anyone authenticated can create groups"
  on public.groups for insert with check (auth.uid() = admin_id);
create policy "Admin can update group"
  on public.groups for update using (admin_id = auth.uid());

-- Group members policies
create policy "Members can view group members"
  on public.group_members for select using (public.is_group_member(group_id, auth.uid()));
create policy "Users can join groups"
  on public.group_members for insert with check (auth.uid() = user_id);
create policy "Admin can update members"
  on public.group_members for update using (
    exists (select 1 from public.groups g where g.id = group_id and g.admin_id = auth.uid())
  );

-- Cycles policies
create policy "Members can view cycles"
  on public.cycles for select using (public.is_group_member(group_id, auth.uid()));
create policy "Admin can insert cycles"
  on public.cycles for insert with check (
    exists (select 1 from public.groups g where g.id = group_id and g.admin_id = auth.uid())
  );
create policy "Admin can update cycles"
  on public.cycles for update using (
    exists (select 1 from public.groups g where g.id = group_id and g.admin_id = auth.uid())
  );

-- Contributions policies
create policy "Members can view contributions"
  on public.contributions for select using (
    exists (
      select 1 from public.cycles c
      where c.id = cycle_id and public.is_group_member(c.group_id, auth.uid())
    )
  );
create policy "Members can insert own pending contributions"
  on public.contributions for insert with check (auth.uid() = user_id);

-- Payouts policies
create policy "Members can view payouts"
  on public.payouts for select using (
    exists (
      select 1 from public.cycles c
      where c.id = cycle_id and public.is_group_member(c.group_id, auth.uid())
    )
  );

-- Audit log
create policy "Members can view audit in their groups"
  on public.payment_audit_log for select using (
    exists (
      select 1 from public.contributions co
      join public.cycles c on c.id = co.cycle_id
      where co.id = contribution_id and public.is_group_member(c.group_id, auth.uid())
    )
  );
create policy "Admin can insert audit log"
  on public.payment_audit_log for insert with check (auth.uid() = marked_by);

-- Enable realtime
alter publication supabase_realtime add table public.groups;
alter publication supabase_realtime add table public.group_members;
alter publication supabase_realtime add table public.cycles;
alter publication supabase_realtime add table public.contributions;
