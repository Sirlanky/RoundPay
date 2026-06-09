import { useFocusEffect, useRouter, type Href } from 'expo-router';
import { useCallback, useState } from 'react';
import { AdminWalletCard } from '@/components/admin/AdminWalletCard';
import { fetchAdminDashboard } from '@/lib/admin/admin-dashboard';
import { fetchAdminFeeSummary } from '@/lib/money-summary';
import { getProfileNameParts } from '@/lib/profile-setup';
import { useAuth } from '@/contexts/AuthContext';

interface Props {
  userId: string;
}

export function HomeAdminDashboardCard({ userId }: Props) {
  const { profile } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({
    groupCount: null as number | null,
    activeGroups: 0,
    pendingCount: 0,
    outstanding: 0,
    received: 0,
    adminFeesEarned: 0,
    completedGroups: 0,
  });

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      void Promise.all([fetchAdminDashboard(userId), fetchAdminFeeSummary(userId)])
        .then(([dashboard, fees]) => {
          if (cancelled) return;
          setStats({
            groupCount: dashboard.stats.totalGroups,
            activeGroups: dashboard.stats.activeGroups,
            pendingCount: dashboard.stats.pendingConfirmations,
            outstanding: dashboard.stats.contributionsOutstanding,
            received: dashboard.stats.contributionsReceived,
            adminFeesEarned: fees.totalEarned,
            completedGroups: dashboard.groups.filter((g) => g.group.status === 'completed').length,
          });
        })
        .catch(() => {
          if (cancelled) return;
          setStats({
            groupCount: null,
            activeGroups: 0,
            pendingCount: 0,
            outstanding: 0,
            received: 0,
            adminFeesEarned: 0,
            completedGroups: 0,
          });
        });
      return () => {
        cancelled = true;
      };
    }, [userId])
  );

  const { firstName, lastName } = getProfileNameParts(profile);
  const holderName = [firstName, lastName].filter(Boolean).join(' ').toUpperCase() || 'ADMIN';

  return (
    <AdminWalletCard
      stats={{ ...stats, holderName }}
      onPress={() => router.push('/(tabs)/admin-dashboard' as Href)}
    />
  );
}
