import { supabase } from './supabase';
import type { IdentityStatus, Profile } from './types';
import type { TranslationKey } from '@/lib/i18n/keys';

export type { IdentityStatus };

export const IDENTITY_STATUS_LABEL_KEYS: Record<IdentityStatus, TranslationKey> = {
  not_started: 'identity.statusNotStarted',
  in_review: 'identity.statusInReview',
  verified: 'identity.statusVerified',
};

function normalizeIdentityStatus(raw: unknown): IdentityStatus {
  if (raw === 'in_review' || raw === 'verified') return raw;
  return 'not_started';
}

export function identityStatusFromProfile(
  profile: Pick<Profile, 'identity_status'> | null | undefined
): IdentityStatus {
  return normalizeIdentityStatus(profile?.identity_status);
}

export function isVerifiedAdmin(profile: Pick<Profile, 'identity_status'> | null | undefined): boolean {
  return identityStatusFromProfile(profile) === 'verified';
}

export async function getIdentityStatus(userId: string): Promise<IdentityStatus> {
  const { data, error } = await supabase
    .from('profiles')
    .select('identity_status')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    if (isIdentityColumnMissing(error)) return 'not_started';
    throw error;
  }

  return normalizeIdentityStatus(data?.identity_status);
}

export async function submitIdentityVerification(): Promise<IdentityStatus> {
  const { data, error } = await supabase.rpc('submit_identity_verification');

  if (error) {
    if (isIdentityRpcMissing(error)) {
      throw new Error('IDENTITY_MIGRATION_REQUIRED');
    }
    throw error;
  }

  const profile = data as { identity_status?: unknown } | null;
  return normalizeIdentityStatus(profile?.identity_status ?? 'in_review');
}

export async function assertCanAdministerGroup(
  userId: string,
  profile?: Pick<Profile, 'identity_status'> | null
): Promise<void> {
  const status = profile ? identityStatusFromProfile(profile) : await getIdentityStatus(userId);

  if (status === 'verified') return;
  if (status === 'in_review') throw new Error('ADMIN_IDENTITY_IN_REVIEW');
  throw new Error('ADMIN_IDENTITY_REQUIRED');
}

export function isIdentityColumnMissing(error: { code?: string; message?: string }): boolean {
  return (
    error.code === '42703' ||
    (error.message?.includes('identity_status') ?? false) ||
    (error.message?.includes('column') ?? false)
  );
}

function isIdentityRpcMissing(error: { code?: string; message?: string }): boolean {
  return (
    error.code === 'PGRST202' ||
    (error.message?.includes('submit_identity_verification') ?? false) ||
    (error.message?.includes('Could not find the function') ?? false)
  );
}
