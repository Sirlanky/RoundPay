import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { CycleHistoryList } from '@/components/group/CycleHistoryRow';
import { Text } from '@/components/ui';
import { useTranslation } from '@/contexts/LanguageContext';
import { formatNaira } from '@/lib/format';
import { fetchGroupHistory } from '@/lib/group-history';
import { spacing, useThemeTokens } from '@/theme';

interface Props {
  groupId: string;
  adminId: string;
  adminFeePercent: number;
  reloadToken?: number;
}

export function GroupCycleHistory({ groupId, adminId, adminFeePercent, reloadToken }: Props) {
  const { colors } = useThemeTokens();
  const { t } = useTranslation();
  const router = useRouter();
  const [cycles, setCycles] = useState<Awaited<ReturnType<typeof fetchGroupHistory>>['cycles']>([]);
  const [totalPaidOut, setTotalPaidOut] = useState(0);
  const [totalFees, setTotalFees] = useState(0);
  const [loading, setLoading] = useState(true);

  const openHistory = () => router.push(`/group/${groupId}/history` as Href);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetchGroupHistory(groupId);
        if (!active) return;
        setCycles(res.cycles);
        setTotalPaidOut(res.totalPaidOut);
        setTotalFees(res.totalFees);
      } catch {
        if (active) setCycles([]);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [groupId, reloadToken]);

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!cycles.length) return null;

  return (
    <View style={styles.wrap}>
      <Pressable onPress={openHistory} style={({ pressed }) => [{ opacity: pressed ? 0.92 : 1 }]}>
        <View style={styles.headerRow}>
          <Text variant="headingSmall">{t('group.cycleHistory')}</Text>
          <Text variant="bodySmall" color="accent" style={styles.viewAll}>
            {t('group.viewFullHistory')}
          </Text>
        </View>
        <Text variant="bodySmall" color="secondary" style={styles.summary}>
          {formatNaira(totalPaidOut)} {t('group.paidOut')}
          {totalFees > 0 ? ` · ${formatNaira(totalFees)} ${t('group.fees')}` : ''}
        </Text>
      </Pressable>

      <CycleHistoryList
        cycles={cycles}
        adminId={adminId}
        adminFeePercent={adminFeePercent}
        onCyclePress={() => openHistory()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.md },
  loading: { paddingVertical: spacing.lg, alignItems: 'center' },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  viewAll: { fontWeight: '600' },
  summary: { marginBottom: spacing.sm },
});
