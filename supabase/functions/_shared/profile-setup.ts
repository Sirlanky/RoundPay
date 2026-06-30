type ProfileRow = {
  first_name?: string | null;
  last_name?: string | null;
  full_name?: string | null;
  phone?: string | null;
  account_number?: string | null;
  paystack_recipient_code?: string | null;
};

function splitFullName(fullName: string | null | undefined) {
  const parts = fullName?.trim().split(/\s+/).filter(Boolean) ?? [];
  if (parts.length === 0) return { firstName: '', lastName: '' };
  if (parts.length === 1) return { firstName: parts[0], lastName: '' };
  return { firstName: parts[0], lastName: parts[parts.length - 1] };
}

export function getProfileNameParts(profile: ProfileRow | null | undefined) {
  const fromFull = splitFullName(profile?.full_name);
  return {
    firstName: profile?.first_name?.trim() || fromFull.firstName,
    lastName: profile?.last_name?.trim() || fromFull.lastName,
  };
}

export function isProfileReadyForTransfers(profile: ProfileRow | null | undefined): boolean {
  if (!profile) return false;

  const { firstName, lastName } = getProfileNameParts(profile);

  if (!firstName || !lastName) return false;
  if (!profile.phone?.trim()) return false;
  if (!profile.account_number?.trim() || !profile.paystack_recipient_code?.trim()) return false;

  return true;
}
