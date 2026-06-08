import { makeRedirectUri } from 'expo-auth-session';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Linking from 'expo-linking';

export const APP_AUTH_SCHEME = 'ajoesusu';

/** True when running inside the App Store / Play Store Expo Go app (not a dev or production build). */
export function isExpoGo(): boolean {
  return Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
}

/** Redirect URL Supabase must allow (Auth → URL configuration). */
export function getAuthRedirectUrl(): string {
  const fromLinking = Linking.createURL('auth/callback');

  // Expo Go must use exp:// — several apps can handle it, so the OS shows "Open with".
  if (isExpoGo()) {
    return fromLinking;
  }

  // Dev client & production builds: use the RoundPay scheme so links open this app directly.
  if (fromLinking.startsWith(`${APP_AUTH_SCHEME}://`)) {
    return fromLinking;
  }

  return makeRedirectUri({
    scheme: APP_AUTH_SCHEME,
    path: 'auth/callback',
  });
}

/** Shown in dev so you can paste the exact redirect URL into Supabase redirect allowlist. */
export function getAuthRedirectUrlForDocs(): string {
  const uri = getAuthRedirectUrl();
  const lines = [uri];

  if (isExpoGo()) {
    lines.push(
      '',
      'Expo Go: add exp://** in Supabase redirect URLs.',
      'Links may show "Open with" — pick Expo Go → Always, or use the 6-digit code instead.',
      'For one-tap links, install a dev build (ajoesusu://**).'
    );
  } else {
    lines.push('', `Add ${APP_AUTH_SCHEME}://** in Supabase redirect URLs.`);
  }

  return lines.join('\n');
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
