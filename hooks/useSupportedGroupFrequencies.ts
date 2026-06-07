import { useEffect, useState } from 'react';
import {
  getSupportedGroupFrequencies,
  pickDefaultFrequency,
  refreshSupportedGroupFrequencies,
} from '@/lib/group-frequency-support';
import { GROUP_FREQUENCIES } from '@/lib/group-frequency';
import type { GroupFrequency } from '@/lib/types';

export function useSupportedGroupFrequencies() {
  const [supported, setSupported] = useState<GroupFrequency[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const list = await getSupportedGroupFrequencies();
        if (!cancelled) setSupported(list);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return {
    supported: supported ?? GROUP_FREQUENCIES,
    loading,
    refresh: async () => {
      setLoading(true);
      const list = await refreshSupportedGroupFrequencies();
      setSupported(list);
      setLoading(false);
      return list;
    },
    defaultFrequency: pickDefaultFrequency(supported ?? GROUP_FREQUENCIES),
  };
}
