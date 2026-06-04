import type { GroupMember, Profile } from './types';

export type MemberWithProfile = GroupMember & { profile?: Profile | null };

export function memberDisplayName(member: MemberWithProfile): string {
  const name = member.profile?.full_name?.trim();
  if (name) return name;
  const email = member.profile?.email?.split('@')[0];
  if (email) return email;
  return `Member ${member.rotation_order}`;
}
