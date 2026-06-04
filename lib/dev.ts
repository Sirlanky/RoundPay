/**
 * Dev launch behavior (see .env.example):
 * - EXPO_PUBLIC_SKIP_AUTH=true → sign in as guest automatically on launch (full app control)
 * - EXPO_PUBLIC_PREVIEW_UI=true → preview-only mode (no saving), overrides auto guest
 */
export const previewUiOnLaunch = process.env.EXPO_PUBLIC_PREVIEW_UI === 'true';
export const autoGuestOnLaunch =
  process.env.EXPO_PUBLIC_SKIP_AUTH === 'true' || (__DEV__ && !previewUiOnLaunch);

/** @deprecated Use autoGuestOnLaunch / previewUiOnLaunch */
export const skipAuthOnLaunch = autoGuestOnLaunch;
