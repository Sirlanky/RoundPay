export { poolSummary } from './admin-fee';

const INVITE_CODE = /^[A-Z2-9]{6}$/;

export function parseContributionAmount(raw: string): number | null {
  const n = parseInt(raw.replace(/\D/g, ''), 10);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

export function isValidInviteCode(code: string): boolean {
  return INVITE_CODE.test(code.trim().toUpperCase());
}

export function validateCreateGroupInput(input: {
  name: string;
  amountRaw: string;
  maxMembersRaw: string;
  adminFeeRaw: string;
}): { ok: true; data: { name: string; contributionAmount: number; maxMembers: number; adminFeePercent: number } } | { ok: false; message: string } {
  const name = input.name.trim();
  if (!name) return { ok: false, message: 'Enter a group name.' };

  const contributionAmount = parseContributionAmount(input.amountRaw);
  if (contributionAmount == null) return { ok: false, message: 'Enter a valid contribution amount in Naira.' };

  const maxMembers = parseInt(input.maxMembersRaw.replace(/\D/g, ''), 10);
  if (!Number.isFinite(maxMembers) || maxMembers < 2 || maxMembers > 50) {
    return { ok: false, message: 'Max members must be between 2 and 50.' };
  }

  const adminFeePercent = parseFloat(input.adminFeeRaw) || 0;
  if (adminFeePercent < 0 || adminFeePercent > 100) {
    return { ok: false, message: 'Admin fee must be between 0% and 100%.' };
  }

  return { ok: true, data: { name, contributionAmount, maxMembers, adminFeePercent } };
}

export function rosterIsComplete(memberCount: number, maxMembers: number): boolean {
  return memberCount >= maxMembers;
}

export function membersStillNeeded(memberCount: number, maxMembers: number): number {
  return Math.max(0, maxMembers - memberCount);
}

