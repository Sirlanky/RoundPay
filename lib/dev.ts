/**
 * Dev launch behavior (see .env.example):
 * - EXPO_PUBLIC_SKIP_AUTH=true → sign in as guest automatically on launch
 */
import { SIMPLE_GUEST_AUTH } from './auth-mode';

export const previewUiOnLaunch = false;
/** Auto guest on launch when using simple auth or EXPO_PUBLIC_SKIP_AUTH. */
export const autoGuestOnLaunch =
  SIMPLE_GUEST_AUTH || process.env.EXPO_PUBLIC_SKIP_AUTH === 'true';

/** @deprecated Use autoGuestOnLaunch / previewUiOnLaunch */
export const skipAuthOnLaunch = autoGuestOnLaunch;
