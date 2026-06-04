export type GroupFrequency = 'weekly' | 'monthly';
export type GroupStatus = 'draft' | 'active' | 'completed';
export type MemberRole = 'admin' | 'member';
export type CycleStatus = 'open' | 'collecting' | 'completed' | 'paid_out';
export type ContributionStatus = 'pending' | 'paid' | 'failed';
export type PayoutStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  bank_code: string | null;
  bank_name: string | null;
  account_number: string | null;
  account_name: string | null;
  paystack_recipient_code: string | null;
  expo_push_token: string | null;
  created_at: string;
  updated_at: string;
}

export interface AjoGroup {
  id: string;
  name: string;
  contribution_amount: number;
  frequency: GroupFrequency;
  max_members: number;
  admin_fee_percent: number;
  status: GroupStatus;
  current_cycle: number;
  admin_id: string;
  invite_code: string;
  created_at: string;
  updated_at: string;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  rotation_order: number;
  role: MemberRole;
  has_collected: boolean;
  joined_at: string;
  profile?: Profile;
}

export interface Cycle {
  id: string;
  group_id: string;
  cycle_number: number;
  recipient_id: string;
  due_date: string;
  status: CycleStatus;
  created_at: string;
  recipient?: Profile;
}

export interface Contribution {
  id: string;
  cycle_id: string;
  member_id: string;
  user_id: string;
  amount: number;
  status: ContributionStatus;
  paystack_reference: string | null;
  paid_at: string | null;
  created_at: string;
}

export interface Payout {
  id: string;
  cycle_id: string;
  recipient_id: string;
  amount: number;
  status: PayoutStatus;
  paystack_transfer_code: string | null;
  created_at: string;
}
