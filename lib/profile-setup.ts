import { splitFullName } from './profile-form';
import type { Profile } from './types';

export type ProfileSetupItem = 'name' | 'phone' | 'bank';

export function getProfileNameParts(profile: Profile | null | undefined): {
  firstName: string;
  lastName: string;
} {
  const fromFull = splitFullName(profile?.full_name);
  return {
    firstName: profile?.first_name?.trim() || fromFull.firstName,
    lastName: profile?.last_name?.trim() || fromFull.lastName,
  };
}

export function getMissingProfileSetupItems(profile: Profile | null | undefined): ProfileSetupItem[] {
  const missing: ProfileSetupItem[] = [];
  const { firstName, lastName } = getProfileNameParts(profile);

  if (!firstName || !lastName) missing.push('name');
  if (!profile?.phone?.trim()) missing.push('phone');
  if (!profile?.account_number?.trim() || !profile?.paystack_recipient_code?.trim()) {
    missing.push('bank');
  }

  return missing;
}

export function isProfileReadyForTransfers(profile: Profile | null | undefined): boolean {
  return getMissingProfileSetupItems(profile).length === 0;
}

export function getProfileSetupSummary(profile: Profile | null | undefined): {
  ready: boolean;
  missing: ProfileSetupItem[];
} {
  const missing = getMissingProfileSetupItems(profile);
  return { ready: missing.length === 0, missing };
}
