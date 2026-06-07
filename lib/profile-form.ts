import type { Profile, ProfileGender } from './types';

export interface ProfileFormValues {
  firstName: string;
  middleName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: ProfileGender | '';
}

export const PROFILE_GENDER_OPTIONS: Array<{ value: ProfileGender; label: string }> = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

export function splitFullName(fullName: string | null | undefined): Pick<
  ProfileFormValues,
  'firstName' | 'middleName' | 'lastName'
> {
  const parts = fullName?.trim().split(/\s+/).filter(Boolean) ?? [];
  if (parts.length === 0) return { firstName: '', middleName: '', lastName: '' };
  if (parts.length === 1) return { firstName: parts[0], middleName: '', lastName: '' };
  if (parts.length === 2) return { firstName: parts[0], middleName: '', lastName: parts[1] };
  return {
    firstName: parts[0],
    middleName: parts.slice(1, -1).join(' '),
    lastName: parts[parts.length - 1],
  };
}

export function buildFullName(firstName: string, middleName: string, lastName: string): string | null {
  const parts = [firstName, middleName, lastName].map((s) => s.trim()).filter(Boolean);
  return parts.length ? parts.join(' ') : null;
}

export function formatDateOfBirthInput(value: string | null | undefined): string {
  if (!value) return '';
  return value.slice(0, 10);
}

export function profileToFormValues(
  profile: Profile | null | undefined,
  userEmail?: string | null
): ProfileFormValues {
  const fromParts = splitFullName(profile?.full_name);
  return {
    firstName: profile?.first_name?.trim() ?? fromParts.firstName,
    middleName: profile?.middle_name?.trim() ?? fromParts.middleName,
    lastName: profile?.last_name?.trim() ?? fromParts.lastName,
    email: profile?.email?.trim() ?? userEmail?.trim() ?? '',
    phone: profile?.phone?.trim() ?? '',
    dateOfBirth: formatDateOfBirthInput(profile?.date_of_birth),
    gender: profile?.gender ?? '',
  };
}

export function formValuesToProfileUpdate(values: ProfileFormValues) {
  const firstName = values.firstName.trim() || null;
  const middleName = values.middleName.trim() || null;
  const lastName = values.lastName.trim() || null;
  const email = values.email.trim() || null;
  const phone = values.phone.trim() || null;
  const dateOfBirth = values.dateOfBirth.trim() || null;
  const gender = values.gender || null;

  return {
    first_name: firstName,
    middle_name: middleName,
    last_name: lastName,
    full_name: buildFullName(values.firstName, values.middleName, values.lastName),
    email,
    phone,
    date_of_birth: dateOfBirth,
    gender,
  };
}

export function validateProfileForm(values: ProfileFormValues): string | null {
  if (!values.firstName.trim()) return 'First name is required.';
  if (!values.lastName.trim()) return 'Last name is required.';

  const email = values.email.trim();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return 'Enter a valid email address.';
  }

  const dob = values.dateOfBirth.trim();
  if (dob) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
      return 'Date of birth must be YYYY-MM-DD.';
    }
    const parsed = new Date(`${dob}T12:00:00`);
    if (Number.isNaN(parsed.getTime())) return 'Enter a valid date of birth.';
    if (parsed > new Date()) return 'Date of birth cannot be in the future.';
  }

  return null;
}

export function genderLabel(gender: ProfileGender | null | undefined): string | null {
  if (!gender) return null;
  return PROFILE_GENDER_OPTIONS.find((o) => o.value === gender)?.label ?? null;
}

export function isProfileDetailsColumnMissing(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const e = error as { message?: string; code?: string };
  return (
    e.code === 'PGRST204' ||
    (e.message?.includes('first_name') ?? false) ||
    (e.message?.includes('date_of_birth') ?? false) ||
    (e.message?.includes('gender') ?? false)
  );
}
