import { SIMPLE_GUEST_AUTH } from './auth-mode';

/** Allow one-tap profile attestation when OTP providers are not set up. */
export const PLACEHOLDER_IDENTITY_ENABLED =
  SIMPLE_GUEST_AUTH || process.env.EXPO_PUBLIC_PLACEHOLDER_IDENTITY === 'true';
