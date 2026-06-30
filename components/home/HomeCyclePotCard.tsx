import { StyleSheet, View } from 'react-native';
import { Card, Text } from '@/components/ui';
import { useTranslation } from '@/contexts/LanguageContext';
import { formatNaira } from '@/lib/format';
import type { CyclePotProgress } from '@/lib/home-dashboard';
import { spacing, useThemeTokens } from '@/theme';

interface Props {
  pot: CyclePotProgress;
}

export function HomeCyclePotCard({ pot }: Props) {
  const { t } = useTranslation();
  const { colors } = useThemeTokens();
  const progress = pot.expectedGross > 0 ? pot.collectedGross / pot.expectedGross : 0;

  return (
    <Card variant="standard" style={styles.card}>
      <View style={styles.topRow}>
        <Text variant="caption" color="secondary">
          {t('home.thisRound')}
        </Text>
        <Text variant="caption" style={styles.count}>
          {t('home.paidCount', { paid: pot.paidCount, total: pot.totalCount })}
        </Text>
      </View>
      <Text variant="headingMedium" style={styles.amounts}>
        {formatNaira(pot.collectedGross)}
        <Text variant="bodyMedium" color="secondary">
          {' '}
          / {formatNaira(pot.expectedGross)}
        </Text>
      </Text>
      <View style={[styles.barBg, { backgroundColor: colors.border }]}>
        <View
          style={[
            styles.barFill,
            {
              width: `${Math.min(progress * 100, 100)}%`,
              backgroundColor: progress >= 1 ? colors.success : colors.primary,
            },
          ]}
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.md, padding: spacing.md },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs },
  count: { fontWeight: '700' },
  amounts: { marginBottom: spacing.sm },
  barBg: { height: 8, borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
});
