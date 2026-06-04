import { useContributions } from './useContributions';
import type { Cycle } from '@/lib/types';

export function useCycle(cycle: Cycle | null | undefined) {
  const { contributions, loading, paidCount, allPaid, refetch } = useContributions(cycle?.id);

  return {
    cycle,
    contributions,
    loading,
    paidCount,
    allPaid,
    refetch,
  };
}
