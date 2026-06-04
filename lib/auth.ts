import * as Linking from 'expo-linking';
import { supabase } from './supabase';

/** Parse access tokens from Supabase magic-link redirect URLs */
export async function createSessionFromUrl(url: string): Promise<boolean> {
  try {
    const parsed = Linking.parse(url);
    const params = parsed.queryParams ?? {};

    const access_token = params.access_token as string | undefined;
    const refresh_token = params.refresh_token as string | undefined;

    if (access_token && refresh_token) {
      const { error } = await supabase.auth.setSession({ access_token, refresh_token });
      return !error;
    }

    // Hash fragment style: #access_token=...&refresh_token=...
    if (url.includes('access_token')) {
      const hash = url.split('#')[1] ?? '';
      const hashParams = new URLSearchParams(hash);
      const at = hashParams.get('access_token');
      const rt = hashParams.get('refresh_token');
      if (at && rt) {
        const { error } = await supabase.auth.setSession({
          access_token: at,
          refresh_token: rt,
        });
        return !error;
      }
    }

    // OTP in URL: token_hash + type=email
    const token_hash = (params.token_hash as string) ?? undefined;
    const type = (params.type as string) ?? 'email';
    if (token_hash) {
      const { error } = await supabase.auth.verifyOtp({
        token_hash,
        type: type as 'email',
      });
      return !error;
    }
  } catch {
    return false;
  }
  return false;
}

export async function sendEmailOtp(email: string) {
  return supabase.auth.signInWithOtp({
    email: email.trim(),
    options: {
      shouldCreateUser: true,
      emailRedirectTo: Linking.createURL('/'),
    },
  });
}
