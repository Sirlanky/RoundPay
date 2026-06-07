-- Placeholder KYC: confirm profile details → preview verified (not real BVN/NIN yet).

alter table public.profiles
  add column if not exists identity_verification_method text;

alter table public.profiles drop constraint if exists profiles_identity_verification_method_check;
alter table public.profiles
  add constraint profiles_identity_verification_method_check
  check (identity_verification_method is null or identity_verification_method in ('placeholder', 'provider'));

comment on column public.profiles.identity_verification_method is
  'How identity was verified. placeholder = profile attestation only; provider = real KYC partner.';

-- Unblock users stuck on the old in_review placeholder flow.
update public.profiles
set
  identity_status = 'verified',
  identity_verification_method = 'placeholder',
  identity_verified_at = coalesce(identity_verified_at, now()),
  updated_at = now()
where identity_status = 'in_review';

create or replace function public.guard_profile_identity_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' and new.identity_status is distinct from old.identity_status then
    if auth.uid() = new.id and new.identity_status = 'verified' then
      if coalesce(current_setting('roundpay.placeholder_kyc', true), '') <> 'on'
         and coalesce(new.identity_verification_method, '') <> 'placeholder' then
        raise exception 'Identity verification must be approved by RoundPay';
      end if;
    end if;
    if auth.uid() = new.id and old.identity_status = 'verified' and new.identity_status <> 'verified' then
      raise exception 'Verified identity cannot be removed by the user';
    end if;
  end if;
  return new;
end;
$$;

create or replace function public.submit_identity_verification()
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

revoke all on function public.submit_identity_verification() from public;
grant execute on function public.submit_identity_verification() to authenticated;
