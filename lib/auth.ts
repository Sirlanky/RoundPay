import * as Linking from 'expo-linking';
import { getAuthRedirectUrl } from './redirect';
import { supabase } from './supabase';

function firstParam(value: string | string[] | undefined): string | undefined {
  if (value == null) return undefined;
  return Array.isArray(value) ? value[0] : value;
}

function parseUrlParams(url: string): URLSearchParams {
  const params = new URLSearchParams();
  try {
    const parsed = new URL(url);
    parsed.searchParams.forEach((v, k) => params.set(k, v));
    const hash = parsed.hash?.replace(/^#/, '') ?? '';
    if (hash) {
      new URLSearchParams(hash).forEach((v, k) => params.set(k, v));
    }
  } catch {
    const q = url.split('?')[1]?.split('#')[0] ?? '';
    const h = url.includes('#') ? (url.split('#')[1] ?? '') : '';
    new URLSearchParams(q).forEach((v, k) => params.set(k, v));
    new URLSearchParams(h).forEach((v, k) => params.set(k, v));
  }
  return params;
}

/** Parse Supabase magic-link / OAuth redirect and create a session. */
export async function createSessionFromUrl(url: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const parsed = Linking.parse(url);
    const query = parsed.queryParams ?? {};
    const merged = parseUrlParams(url);

    const code = firstParam(query.code as string | string[] | undefined) ?? merged.get('code') ?? undefined;
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) return { ok: false, error: error.message };
      return { ok: true };
    }

    const access_token =
      firstParam(query.access_token as string | string[] | undefined) ?? merged.get('access_token') ?? undefined;
    const refresh_token =
      firstParam(query.refresh_token as string | string[] | undefined) ?? merged.get('refresh_token') ?? undefined;

    if (access_token && refresh_token) {
      const { error } = await supabase.auth.setSession({ access_token, refresh_token });
      if (error) return { ok: false, error: error.message };
      return { ok: true };
    }

    const token_hash =
      firstParam(query.token_hash as string | string[] | undefined) ?? merged.get('token_hash') ?? undefined;
    const type = firstParam(query.type as string | string[] | undefined) ?? merged.get('type') ?? 'email';
    if (token_hash) {
      const { error } = await supabase.auth.verifyOtp({
        token_hash,
        type: type as 'email',
      });
      if (error) return { ok: false, error: error.message };
      return { ok: true };
    }

    return { ok: false, error: 'No sign-in tokens in this link. Use the 6-digit code on the Verify screen instead.' };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Could not open sign-in link' };
  }
}

/**
 * Request sign-in email. Includes redirect for magic-link sign-in.
 * A 6-digit code appears only if the Supabase Magic Link template contains {{ .Token }}.
 */
export async function sendEmailOtp(email: string) {
  return supabase.auth.signInWithOtp({
    email: email.trim(),
    options: {
      shouldCreateUser: true,
      emailRedirectTo: getAuthRedirectUrl(),
    },
  });
}

