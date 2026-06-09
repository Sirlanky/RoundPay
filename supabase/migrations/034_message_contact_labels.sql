-- Private display names for message contacts (per user).

create table if not exists public.message_contact_labels (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  contact_id uuid not null references public.profiles(id) on delete cascade,
  label text not null check (char_length(btrim(label)) > 0 and char_length(label) <= 80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint message_contact_labels_distinct check (owner_id <> contact_id),
  constraint message_contact_labels_unique unique (owner_id, contact_id)
);

create index if not exists message_contact_labels_owner_idx
  on public.message_contact_labels (owner_id);

alter table public.message_contact_labels enable row level security;

drop policy if exists "Owners read own contact labels" on public.message_contact_labels;
create policy "Owners read own contact labels"
  on public.message_contact_labels for select
  to authenticated
  using ((select auth.uid()) = owner_id);

drop policy if exists "Owners insert own contact labels" on public.message_contact_labels;
create policy "Owners insert own contact labels"
  on public.message_contact_labels for insert
  to authenticated
  with check ((select auth.uid()) = owner_id);

drop policy if exists "Owners update own contact labels" on public.message_contact_labels;
create policy "Owners update own contact labels"
  on public.message_contact_labels for update
  to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

drop policy if exists "Owners delete own contact labels" on public.message_contact_labels;
create policy "Owners delete own contact labels"
  on public.message_contact_labels for delete
  to authenticated
  using ((select auth.uid()) = owner_id);

grant select, insert, update, delete on public.message_contact_labels to authenticated;

notify pgrst, 'reload schema';
