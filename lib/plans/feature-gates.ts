import { DEFAULT_PLAN, PLAN_DEFINITIONS, type PlanCode, type PlanFeature } from './plan-definitions';

export function canUsePlanFeature(plan: PlanCode, feature: PlanFeature): boolean {
  return PLAN_DEFINITIONS[plan]?.features[feature] ?? false;
}

export function maxGroupsForPlan(plan: PlanCode): number {
  return PLAN_DEFINITIONS[plan]?.maxGroups ?? PLAN_DEFINITIONS[DEFAULT_PLAN].maxGroups;
}

export function canCreateAnotherGroup(plan: PlanCode, currentGroupCount: number): boolean {
  return currentGroupCount < maxGroupsForPlan(plan);
}
