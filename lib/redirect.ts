import { makeRedirectUri } from 'expo-auth-session';
import * as Linking from 'expo-linking';

/** Redirect URL Supabase must allow (Auth → URL configuration). */
export function getAuthRedirectUrl(): string {
  // Expo Go uses exp://…/--/auth/callback — required for email magic links on device.
  const expoGoUrl = Linking.createURL('auth/callback');
  if (expoGoUrl.startsWith('exp://')) {
    return expoGoUrl;
  }
  return makeRedirectUri({
    scheme: 'ajoesusu',
    path: 'auth/callback',
  });
}

/** Shown in dev so you can paste the exact Expo Go URL into Supabase redirect allowlist. */
export function getAuthRedirectUrlForDocs(): string {
  const uri = getAuthRedirectUrl();
  const expRoot = Linking.createURL('/');
  return `${uri}\n(Expo Go root: ${expRoot})`;
}

export function urlHasAuthParams(url: string): boolean {
  return (
    url.includes('code=') ||
    url.includes('access_token') ||
    url.includes('token_hash') ||
    url.includes('type=magiclink') ||
    url.includes('type=email')
  );
}

/** Rebuild a callback URL from expo-router query params (hash tokens may be stripped). */
export function callbackUrlFromParams(params: Record<string, string | string[] | undefined>): string | null {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value == null || key === 'email') continue;
    const v = Array.isArray(value) ? value[0] : value;
    if (v) search.set(key, v);
  }
  const query = search.toString();
  if (!query) return null;
  return `${getAuthRedirectUrl()}?${query}`;
}
