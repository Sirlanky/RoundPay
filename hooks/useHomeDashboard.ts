import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchHomeDashboard, type HomeDashboardData } from '@/lib/home-dashboard';
import { isPaystackConfigured } from '@/lib/paystack';

interface RefetchOptions {
  /** When true, shows the full-screen loading state. Default false for focus/refresh. */
  showLoading?: boolean;
}

export function useHomeDashboard(userId: string | undefined) {
  const [dashboard, setDashboard] = useState<HomeDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | undefined>();
  const skipNextFocusRef = useRef(true);

  const refetch = useCallback(
    async ({ showLoading = false }: RefetchOptions = {}) => {
      if (!userId) {
        setDashboard(null);
        setLoadError('');
        setLoading(false);
        return;
      }

      if (showLoading) setLoading(true);

      try {
        setLoadError('');
        const data = await fetchHomeDashboard(userId, selectedGroupId);
        setDashboard(data);
      } catch (e) {
        setLoadError(e instanceof Error ? e.message : 'Could not load dashboard');
        setDashboard(null);
      } finally {
        if (showLoading) setLoading(false);
      }
    },
    [userId, selectedGroupId]
  );

  useEffect(() => {
    skipNextFocusRef.current = true;
    void refetch({ showLoading: true });
  }, [refetch]);

  useFocusEffect(
    useCallback(() => {
      if (!userId) return;

      if (skipNextFocusRef.current) {
        skipNextFocusRef.current = false;
        return;
      }

      void refetch({ showLoading: false });
    }, [userId, refetch])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch({ showLoading: false });
    setRefreshing(false);
  }, [refetch]);

  const selectGroup = useCallback((groupId: string) => {
    setSelectedGroupId(groupId);
  }, []);

  const hasGroups = dashboard?.hasGroups ?? false;
  const hasPrimary = Boolean(dashboard?.primaryGroup);
  const groupId = dashboard?.primaryGroup?.id ?? null;
  const isDraft = dashboard?.primaryGroup?.status === 'draft';
  const showPayNow = Boolean(
    dashboard?.userPendingContributionId &&
      dashboard.primaryGroup?.status === 'active' &&
      isPaystackConfigured()
  );
  const showViewPayments = Boolean(
    dashboard?.userContributionStatus === 'pending' &&
      dashboard.primaryGroup?.status === 'active' &&
      !showPayNow
  );
  const showAdminPayments = Boolean(
    dashboard?.isAdmin && dashboard.adminPendingCount > 0 && dashboard.primaryGroup?.status === 'active'
  );

  return {
    dashboard,
    loading,
    loadError,
    refreshing,
    refetch,
    onRefresh,
    selectGroup,
    hasGroups,
    hasPrimary,
    groupId,
    isDraft,
    showPayNow,
    showViewPayments,
    showAdminPayments,
  };
}
