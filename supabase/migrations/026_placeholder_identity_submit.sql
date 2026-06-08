-- Quick profile attestation for dev / when SMS+email OTP providers are not configured yet.

create or replace function public.submit_placeholder_identity_verification()
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  p public.profiles%rowtype;
  has_name boolean;
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

  has_name := coalesce(nullif(trim(p.first_name), ''), nullif(trim(split_part(coalesce(p.full_name, ''), ' ', 1)), '')) is not null
    and coalesce(nullif(trim(p.last_name), ''), nullif(trim(regexp_replace(coalesce(p.full_name, ''), '^\S+\s*', '')), '')) is not null;

  if not has_name then
    raise exception 'IDENTITY_PROFILE_NAME_REQUIRED';
  end if;

  if coalesce(nullif(trim(p.phone), ''), null) is null then
    raise exception 'IDENTITY_PROFILE_PHONE_REQUIRED';
  end if;

  perform set_config('roundpay.placeholder_kyc', 'on', true);

  update public.profiles
  set
    identity_status = 'verified',
    identity_verification_method = 'placeholder',
    identity_submitted_at = coalesce(identity_submitted_at, now()),
    identity_verified_at = now(),
    updated_at = now()
  where id = auth.uid()
  returning * into p;

  perform set_config('roundpay.placeholder_kyc', 'off', true);

  return p;
end;
$$;

revoke all on function public.submit_placeholder_identity_verification() from public;
grant execute on function public.submit_placeholder_identity_verification() to authenticated;
