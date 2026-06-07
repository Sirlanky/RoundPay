import type { Profile } from './types';
import type { User } from '@supabase/supabase-js';
import { buildFullName, genderLabel, splitFullName } from './profile-form';

export function getProfileInitials(profile: Profile | null | undefined, email?: string | null): string {
  const first = profile?.first_name?.trim();
  const last = profile?.last_name?.trim();
  if (first && last) return (first[0] + last[0]).toUpperCase();
  if (first) return first.slice(0, 2).toUpperCase();

  const fullName = profile?.full_name?.trim();
  if (fullName) {
    const parts = splitFullName(fullName);
    if (parts.firstName && parts.lastName) {
      return (parts.firstName[0] + parts.lastName[0]).toUpperCase();
    }
    if (parts.firstName) return parts.firstName.slice(0, 2).toUpperCase();
  }

  const local = email?.split('@')[0]?.trim();
  if (local && local.length >= 2) return local.slice(0, 2).toUpperCase();
  if (local) return local[0].toUpperCase();
  return '?';
}

export function getProfileDisplayName(
  profile: Profile | null | undefined,
  user: User | null | undefined
): string {
  const structured = buildFullName(
    profile?.first_name ?? '',
    profile?.middle_name ?? '',
    profile?.last_name ?? ''
  );
  if (structured) return structured;

  const name = profile?.full_name?.trim();
  if (name) return name;
  const email = profile?.email ?? user?.email;
  if (email) return email.split('@')[0];
  return 'RoundPay member';
}

export function getProfileContactLine(
  profile: Profile | null | undefined,
  user: User | null | undefined
): string | null {
  const phone = profile?.phone?.trim();
  if (phone) return phone;
  const email = profile?.email?.trim() ?? user?.email?.trim();
  if (email) return email;
  return null;
}

export function getProfileMetaLine(profile: Profile | null | undefined): string | null {
  const parts: string[] = [];
  const gender = genderLabel(profile?.gender);
  if (gender) parts.push(gender);
  if (profile?.date_of_birth) {
    const d = new Date(`${profile.date_of_birth.slice(0, 10)}T12:00:00`);
    if (!Number.isNaN(d.getTime())) {
      parts.push(
        d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
      );
    }
  }
  return parts.length ? parts.join(' · ') : null;
}

export function maskAccountNumber(accountNumber: string | null | undefined): string | null {
  if (!accountNumber) return null;
  const digits = accountNumber.replace(/\D/g, '');
  if (digits.length < 4) return accountNumber;
  return `•••• ${digits.slice(-4)}`;
}
