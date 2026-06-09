export type IntervalUnit = 'day' | 'week' | 'month';

/**
 * Contribution frequency. Stored as a flexible interval token like `week:1`,
 * `day:2`, or `month:2` (every N units). Legacy values `daily` | `weekly` |
 * `monthly` are still understood for backward compatibility.
 */
export type GroupFrequency = string;
export type GroupStatus = 'draft' | 'active' | 'completed';
export type MemberRole = 'admin' | 'member';
export type CycleStatus = 'open' | 'collecting' | 'completed' | 'paid_out';
export type ContributionStatus = 'pending' | 'paid' | 'failed';
export type PayoutStatus = 'pending' | 'processing' | 'completed' | 'failed';

export type ProfileGender = 'male' | 'female' | 'other' | 'prefer_not_to_say';
export type IdentityStatus = 'not_started' | 'in_review' | 'verified';

export interface Profile {
  id: string;
  full_name: string | null;
  first_name: string | null;
  middle_name: string | null;
  last_name: string | null;
  date_of_birth: string | null;
  gender: ProfileGender | null;
  phone: string | null;
  email: string | null;
  avatar_url: string | null;
  bank_code: string | null;
  bank_name: string | null;
  account_number: string | null;
  account_name: string | null;
  paystack_recipient_code: string | null;
  expo_push_token: string | null;
  push_enabled?: boolean;
  reminders_enabled?: boolean;
  reminder_contributions?: boolean;
  reminder_overdue?: boolean;
  reminder_payouts?: boolean;
  reminder_hour?: number;
  identity_status?: IdentityStatus;
  identity_verification_method?: 'placeholder' | 'provider' | 'dojah' | 'otp' | null;
  identity_submitted_at?: string | null;
  identity_verified_at?: string | null;
  phone_verified_at?: string | null;
  email_verified_at?: string | null;
  phone_otp_reference_id?: string | null;
  email_otp_reference_id?: string | null;
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
  notes?: string | null;
  penalty_amount?: number;
  penalty_grace_days?: number;
  archived_at?: string | null;
  settings?: Record<string, unknown>;
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

export type NotificationType =
  | 'contribution_due'
  | 'contribution_overdue'
  | 'payout_soon'
  | 'payout_completed'
  | 'member_joined'
  | 'group_joined'
  | 'payment_confirmed'
  | 'payment_received'
  | 'direct_message';

export interface AppNotification {
  id: string;
  user_id: string;
  group_id: string | null;
  type: NotificationType;
  title: string;
  message: string;
  related_entity_id: string | null;
  read_at: string | null;
  created_at: string;
}
