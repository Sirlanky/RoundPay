/** Skip login while building UI (dev only). Set EXPO_PUBLIC_SKIP_AUTH=true in .env */
export const skipAuthOnLaunch = process.env.EXPO_PUBLIC_SKIP_AUTH === 'true';
