import { getProfileNameParts } from './profile-setup';
import type { Profile } from './types';

export type IdentitySetupItem = 'name' | 'phone';

export function getMissingIdentitySetupItems(profile: Profile | null | undefined): IdentitySetupItem[] {
  const missing: IdentitySetupItem[] = [];
  const { firstName, lastName } = getProfileNameParts(profile);

  if (!firstName || !lastName) missing.push('name');
  if (!profile?.phone?.trim()) missing.push('phone');

  return missing;
}

export function isProfileReadyForIdentityVerification(profile: Profile | null | undefined): boolean {
  return getMissingIdentitySetupItems(profile).length === 0;
}

export function isPlaceholderVerified(profile: Profile | null | undefined): boolean {
  return profile?.identity_status === 'verified' && profile?.identity_verification_method === 'placeholder';
}

export function isOtpVerified(profile: Profile | null | undefined): boolean {
  return (
    profile?.identity_status === 'verified' &&
    (profile?.identity_verification_method === 'otp' || profile?.identity_verification_method === 'dojah')
  );
}

/** @deprecated Use isOtpVerified */
export const isDojahVerified = isOtpVerified;

export function isPhoneOtpVerified(profile: Profile | null | undefined): boolean {
  return Boolean(profile?.phone_verified_at);
}

export function isEmailOtpVerified(profile: Profile | null | undefined): boolean {
  return Boolean(profile?.email_verified_at);
}

export function isReadyForOtpIdentityComplete(
  profile: Profile | null | undefined,
  userEmail?: string | null
): boolean {
  const email = profile?.email?.trim() || userEmail?.trim();
  return (
    isProfileReadyForIdentityVerification(profile) &&
    Boolean(email) &&
    isPhoneOtpVerified(profile) &&
    isEmailOtpVerified(profile)
  );
}

/** @deprecated Use isReadyForOtpIdentityComplete */
export const isReadyForDojahIdentityComplete = isReadyForOtpIdentityComplete;
