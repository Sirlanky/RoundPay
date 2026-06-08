import * as WebBrowser from 'expo-web-browser';
import { createSessionFromUrl } from './auth';
import { getAuthRedirectUrl } from './redirect';
import { supabase } from './supabase';

WebBrowser.maybeCompleteAuthSession();

export type OAuthProvider = 'google' | 'apple';

export type OAuthSignInResult = {
  ok: boolean;
  error?: string;
  cancelled?: boolean;
};

/** Sign in with Google or Apple (Supabase OAuth + in-app browser). */
export async function signInWithOAuthProvider(provider: OAuthProvider): Promise<OAuthSignInResult> {
  const redirectTo = getAuthRedirectUrl();

  const {
    data: { user: current },
  } = await supabase.auth.getUser();

  if (current?.is_anonymous) {
    await supabase.auth.signOut();
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
      skipBrowserRedirect: true,
    },
  });

  if (error) {
    return { ok: false, error: error.message };
  }
  if (!data.url) {
    return { ok: false, error: 'Could not start sign-in.' };
  }

  const browser = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

  if (browser.type === 'cancel' || browser.type === 'dismiss') {
    return { ok: false, cancelled: true };
  }

  if (browser.type !== 'success') {
    return { ok: false, error: 'Sign-in was not completed.' };
  }

  return createSessionFromUrl(browser.url);
}
