-- Creates the signed-in user's profile row (works for guest + email users).
-- Run in Supabase SQL Editor if "Could not set up your profile" appears.

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
