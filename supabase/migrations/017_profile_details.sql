-- Extended profile fields for edit profile

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

-- Backfill first_name from legacy full_name when empty
update public.profiles
set first_name = split_part(trim(full_name), ' ', 1)
where full_name is not null
  and nullif(trim(full_name), '') is not null
  and first_name is null;

notify pgrst, 'reload schema';
