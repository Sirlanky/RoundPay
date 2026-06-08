import React, { createContext, useContext, useMemo } from 'react';
import { DEFAULT_PLAN, PLAN_DEFINITIONS, type PlanCode } from '@/lib/plans/plan-definitions';

interface PlanContextValue {
  plan: PlanCode;
  planName: string;
  isPro: boolean;
}

const PlanContext = createContext<PlanContextValue>({
  plan: DEFAULT_PLAN,
  planName: PLAN_DEFINITIONS.free.name,
  isPro: false,
});

/** Billing not wired yet — everyone on Free until subscriptions ship. */
export function PlanProvider({ children }: { children: React.ReactNode }) {
  const value = useMemo<PlanContextValue>(
    () => ({
      plan: DEFAULT_PLAN,
      planName: PLAN_DEFINITIONS[DEFAULT_PLAN].name,
      isPro: false,
    }),
    []
  );

  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>;
}

export function usePlan() {
  return useContext(PlanContext);
}
