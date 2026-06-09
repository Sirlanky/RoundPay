import { useCallback, useEffect, useState } from 'react';
import {
  clearContactLabel,
  fetchContactLabels,
  saveContactLabel,
} from '@/lib/message-labels';

export function useContactLabels(userId: string | undefined) {
  const [labels, setLabels] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!userId) {
      setLabels({});
      setLoading(false);
      return;
    }
    try {
      setLabels(await fetchContactLabels());
    } catch {
      setLabels({});
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    setLoading(true);
    void load();
  }, [load]);

  const setLabel = useCallback(
    async (contactId: string, label: string) => {
      await saveContactLabel(contactId, label);
      setLabels((prev) => ({ ...prev, [contactId]: label.trim() }));
    },
    []
  );

  const removeLabel = useCallback(async (contactId: string) => {
    await clearContactLabel(contactId);
    setLabels((prev) => {
      const next = { ...prev };
      delete next[contactId];
      return next;
    });
  }, []);

  return { labels, loading, refetch: load, setLabel, removeLabel };
}
