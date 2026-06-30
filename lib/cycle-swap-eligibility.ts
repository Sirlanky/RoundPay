import type { Cycle, GroupMember } from './types';
import type { CycleSwapRequest } from './cycle-swap';

export interface CycleSwapEligibility {
  canRequest: boolean;
  reason: 'eligible' | 'already_collected' | 'is_collector' | 'not_member' | 'pending_request' | 'inactive';
}

/** Swap lets a member who has NOT collected yet take this round early — with scheduled collector + admin approval. */
export function cycleSwapEligibility(params: {
  groupStatus: string;
  isDraft: boolean;
  currentCycle: Cycle | null;
  userId?: string;
  members: GroupMember[];
  pendingRequests: CycleSwapRequest[];
}): CycleSwapEligibility {
  const { groupStatus, isDraft, currentCycle, userId, members, pendingRequests } = params;

  if (isDraft || groupStatus !== 'active' || !currentCycle || !userId) {
    return { canRequest: false, reason: 'inactive' };
  }

  if (currentCycle.recipient_id === userId) {
    return { canRequest: false, reason: 'is_collector' };
  }

  const member = members.find((m) => m.user_id === userId);
  if (!member) {
    return { canRequest: false, reason: 'not_member' };
  }

  if (member.has_collected) {
    return { canRequest: false, reason: 'already_collected' };
  }

  if (pendingRequests.some((r) => r.requesterId === userId && r.cycleId === currentCycle.id)) {
    return { canRequest: false, reason: 'pending_request' };
  }

  return { canRequest: true, reason: 'eligible' };
}
