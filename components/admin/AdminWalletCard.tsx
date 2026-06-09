import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui';
import { useTranslation } from '@/contexts/LanguageContext';
import { formatNaira } from '@/lib/format';
import { formatGroupsFinishedLine, formatWalletGroupLine } from '@/lib/i18n/plural';
import { spacing, useThemeTokens } from '@/theme';
import { adminWalletPalette } from './admin-wallet-palette';

export interface AdminWalletStats {
  groupCount: number | null;
  activeGroups: number;
  pendingCount: number;
  outstanding: number;
  received: number;
  adminFeesEarned?: number;
  completedGroups?: number;
  holderName?: string;
}

interface Props {
  stats: AdminWalletStats;
  onPress?: () => void;
  compact?: boolean;
}

export function AdminWalletCard({ stats, onPress, compact = false }: Props) {
  const { t, tp } = useTranslation();
  const { scheme } = useThemeTokens();
  const palette = adminWalletPalette(scheme);

  const inactiveOnly =
    (stats.groupCount ?? 0) > 0 && stats.activeGroups === 0;
  const headlineAmount = inactiveOnly
    ? stats.adminFeesEarned && stats.adminFeesEarned > 0
      ? stats.adminFeesEarned
      : stats.received
    : stats.outstanding > 0
      ? stats.outstanding
      : stats.received;
  const headlineLabel = inactiveOnly
    ? stats.adminFeesEarned && stats.adminFeesEarned > 0
      ? t('admin.kpiEarnings')
      : t('admin.totalCollected')
    : stats.outstanding > 0
      ? t('admin.kpiOutstanding')
      : t('admin.kpiReceived');

  const groupLine =
    stats.groupCount != null
      ? inactiveOnly
        ? formatGroupsFinishedLine(stats.groupCount, stats.completedGroups ?? 0, tp)
        : formatWalletGroupLine(stats.groupCount, stats.activeGroups, tp)
      : '•• •• •• ••';

  const card = (
    <View
      style={[
        styles.card,
        compact && styles.cardCompact,
        !onPress && styles.cardSpaced,
        { backgroundColor: palette.mid, shadowColor: palette.glow },
      ]}>
      <View style={[styles.blob, styles.blobTop, { backgroundColor: palette.glow }]} />
      <View style={[styles.blob, styles.blobBottom, { backgroundColor: palette.base }]} />
      <View style={[styles.sheen, { backgroundColor: palette.ring }]} />

      <View style={styles.topRow}>
        <View style={[styles.chip, { backgroundColor: palette.chip }]}>
          <View style={[styles.chipInner, { backgroundColor: palette.chipInner }]} />
        </View>
        <Text variant="caption" style={{ ...styles.brand, color: palette.inkMuted }}>
          {t('admin.cardBrand')}
        </Text>
      </View>

      <Text variant="caption" style={{ ...styles.cardNumber, color: palette.inkFaint }}>
        {groupLine}
      </Text>

      <View style={styles.balanceBlock}>
        <Text variant="caption" style={{ ...styles.balanceLabel, color: palette.inkMuted }}>
          {headlineLabel}
        </Text>
        <Text variant={compact ? 'headingMedium' : 'display'} style={{ ...styles.balanceAmount, color: palette.ink }}>
          {stats.groupCount != null ? formatNaira(headlineAmount) : '₦—'}
        </Text>
      </View>

      <View style={styles.metricsRow}>
        <View style={styles.metric}>
          <Text variant="caption" style={{ ...styles.metricLabel, color: palette.inkFaint }}>
            {inactiveOnly ? t('admin.totalCollected') : t('admin.kpiReceived')}
          </Text>
          <Text variant="bodySmall" style={{ ...styles.metricValue, color: palette.ink }}>
            {stats.groupCount != null ? formatNaira(stats.received) : '—'}
          </Text>
        </View>
        <View style={styles.metric}>
          <Text variant="caption" style={{ ...styles.metricLabel, color: palette.inkFaint }}>
            {inactiveOnly ? t('admin.kpiEarnings') : t('admin.kpiPending')}
          </Text>
          <Text variant="bodySmall" style={{ ...styles.metricValue, color: palette.ink }}>
            {stats.groupCount != null
              ? inactiveOnly
                ? formatNaira(stats.adminFeesEarned ?? 0)
                : stats.pendingCount
              : '—'}
          </Text>
        </View>
        {stats.holderName ? (
          <View style={[styles.metric, styles.metricWide]}>
            <Text variant="caption" style={{ ...styles.metricLabel, color: palette.inkFaint }}>
              {t('admin.cardHolder')}
            </Text>
            <Text variant="bodySmall" style={{ ...styles.metricValue, color: palette.ink }} numberOfLines={1}>
              {stats.holderName}
            </Text>
          </View>
        ) : null}
      </View>

      {onPress ? (
        <Text variant="caption" style={{ ...styles.tapHint, color: palette.inkMuted }}>
          {t('admin.cardTapHint')} ›
        </Text>
      ) : null}
    </View>
  );

  if (!onPress) return card;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.pressable, { transform: [{ scale: pressed ? 0.985 : 1 }] }]}>
      {card}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: { marginBottom: spacing.md },
  card: {
    borderRadius: 20,
    padding: spacing.lg,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.28,
    shadowRadius: 18,
    elevation: 8,
  },
  cardSpaced: { marginBottom: spacing.md },
  cardCompact: {
    padding: spacing.md,
  },
  blob: { position: 'absolute', borderRadius: 999, opacity: 0.35 },
  blobTop: { width: 160, height: 160, top: -55, right: -35 },
  blobBottom: { width: 120, height: 120, bottom: -40, left: -25, opacity: 0.5 },
  sheen: {
    position: 'absolute',
    top: 14,
    right: -28,
    width: 100,
    height: 180,
    transform: [{ rotate: '24deg' }],
    borderRadius: 24,
    opacity: 0.35,
  },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, zIndex: 1 },
  chip: { width: 38, height: 26, borderRadius: 6, padding: 3, justifyContent: 'center' },
  chipInner: { flex: 1, borderRadius: 4, opacity: 0.85 },
  brand: { flex: 1, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase' },
  cardNumber: { marginTop: spacing.md, letterSpacing: 2, fontWeight: '600', zIndex: 1 },
  balanceBlock: { marginTop: spacing.sm, zIndex: 1 },
  balanceLabel: { textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: '600', marginBottom: 2 },
  balanceAmount: { fontWeight: '800', letterSpacing: -0.5 },
  metricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.md,
    zIndex: 1,
  },
  metric: { minWidth: 72, gap: 2 },
  metricWide: { flex: 1, minWidth: 100 },
  metricLabel: { textTransform: 'uppercase', letterSpacing: 0.5, fontSize: 10, fontWeight: '600' },
  metricValue: { fontWeight: '700' },
  tapHint: { fontWeight: '700', marginTop: spacing.sm, zIndex: 1 },
});
