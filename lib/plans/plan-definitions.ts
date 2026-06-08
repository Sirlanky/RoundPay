export type PlanCode = 'free' | 'pro' | 'premium';

export type PlanFeature = 'reminders' | 'reports' | 'exports' | 'analytics';

export interface PlanDefinition {
  code: PlanCode;
  name: string;
  maxGroups: number;
  maxMembersPerGroup: number;
  features: Record<PlanFeature, boolean>;
}

export const PLAN_DEFINITIONS: Record<PlanCode, PlanDefinition> = {
  free: {
    code: 'free',
    name: 'Free',
    maxGroups: 1,
    maxMembersPerGroup: 20,
    features: { reminders: false, reports: false, exports: false, analytics: false },
  },
  pro: {
    code: 'pro',
    name: 'Pro',
    maxGroups: 5,
    maxMembersPerGroup: 50,
    features: { reminders: true, reports: true, exports: true, analytics: true },
  },
  premium: {
    code: 'premium',
    name: 'Premium',
    maxGroups: 999,
    maxMembersPerGroup: 999,
    features: { reminders: true, reports: true, exports: true, analytics: true },
  },
};

export const DEFAULT_PLAN: PlanCode = 'free';
