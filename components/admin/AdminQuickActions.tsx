import { useRouter, type Href } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { PlatformIcon } from '@/components/navigation/PlatformIcon';
import { Text } from '@/components/ui';
import { useTranslation } from '@/contexts/LanguageContext';
import { formatNaira } from '@/lib/format';
import { primaryAlpha, spacing, useThemeTokens } from '@/theme';

interface Props {
  earningsTotal?: number;
}

export function AdminQuickActions({ earningsTotal }: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const { colors, scheme, radius, shadow } = useThemeTokens();

  const items = [
    {
      key: 'ledger',
      label: t('admin.viewLedger'),
      icon: { ios: 'list.bullet.rectangle', android: 'receipt_long', web: 'receipt_long' },
      href: '/(tabs)/ledger' as Href,
    },
    {
      key: 'payouts',
      label: t('nav.payouts'),
      icon: { ios: 'banknote.fill', android: 'payments', web: 'payments' },
      href: '/(tabs)/payouts' as Href,
    },
    {
      key: 'earnings',
      label: t('admin.quickEarnings'),
      icon: { ios: 'chart.line.uptrend.xyaxis', android: 'trending_up', web: 'trending_up' },
      href: '/profile/earnings' as Href,
    },
  ] as const;

  return (
    <View style={styles.row}>
      {items.map((item) => (
        <Pressable
          key={item.key}
          onPress={() => router.push(item.href)}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.chip,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: radius.lg,
              opacity: pressed ? 0.9 : 1,
            },
            shadow('small'),
          ]}>
          <View style={[styles.icon, { backgroundColor: primaryAlpha(scheme, 12) }]}>
            <PlatformIcon name={item.icon} size={18} color={colors.primary} />
          </View>
          <Text variant="caption" color="secondary" style={styles.label} numberOfLines={2}>
            {item.label}
          </Text>
          {item.key === 'earnings' && earningsTotal != null && earningsTotal > 0 ? (
            <Text variant="caption" color="success" style={styles.badge}>
              {formatNaira(earningsTotal)}
            </Text>
          ) : null}
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  chip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    borderWidth: StyleSheet.hairlineWidth,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  label: { textAlign: 'center', fontWeight: '600', lineHeight: 14 },
  badge: { fontWeight: '700', marginTop: 2, fontSize: 10 },
});
