/**
 * Dev launch behavior (see .env.example):
 * - EXPO_PUBLIC_SKIP_AUTH=true → sign in as guest automatically on launch
 */
export const previewUiOnLaunch = false;
/** Only when explicitly enabled — avoids blocking launch on Supabase guest sign-in in Expo Go. */
export const autoGuestOnLaunch = process.env.EXPO_PUBLIC_SKIP_AUTH === 'true';

/** @deprecated Use autoGuestOnLaunch / previewUiOnLaunch */
export const skipAuthOnLaunch = autoGuestOnLaunch;
