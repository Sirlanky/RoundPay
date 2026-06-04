import { makeRedirectUri } from 'expo-auth-session';
import * as Linking from 'expo-linking';

/** Redirect URL Supabase must allow (Auth → URL configuration). */
export function getAuthRedirectUrl(): string {
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
