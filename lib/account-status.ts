import type { User } from '@supabase/supabase-js';
import { isGuestUser } from './guest-auth';

/** How the app treats the current user for saving data. */
export type AccountMode = 'signed_out' | 'preview' | 'guest' | 'email';

export function getAccountMode(user: User | null | undefined, buildMode: boolean): AccountMode {
  if (buildMode && !user) return 'preview';
  if (!user) return 'signed_out';
  if (isGuestUser(user)) return 'guest';
  return 'email';
}

export function accountModeLabel(mode: AccountMode): string {
  switch (mode) {
    case 'preview':
      return 'Preview — cannot save';
    case 'guest':
      return 'Your account (guest)';
    case 'email':
      return 'Signed in';
    case 'signed_out':
      return 'Not signed in';
  }
}

export function canSaveToCloud(mode: AccountMode): boolean {
  return mode === 'guest' || mode === 'email';
}
