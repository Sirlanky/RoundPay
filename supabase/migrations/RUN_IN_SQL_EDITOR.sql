-- Paste this entire file into Supabase → SQL Editor → Run once.
-- Fixes: guest "Could not set up your profile", join preview, profile insert.

-- 002: allow invite preview while joining
create policy "Authenticated can preview draft groups by invite code"
  on public.groups for select
  to authenticated
  using (status = 'draft');

-- 003: allow users to insert their own profile if trigger missed
drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

-- 004: server-side profile setup (guest + email)
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
