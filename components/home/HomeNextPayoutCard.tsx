import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Button, Card, Text } from '@/components/ui';
import { useTranslation } from '@/contexts/LanguageContext';
import { formatDate, formatNaira } from '@/lib/format';
import { nextPayoutRecipientName, shouldShowNextPayoutOnHome } from '@/lib/home-dashboard';
import type { HomeDashboardData } from '@/lib/home-dashboard';
import { isPaystackConfigured } from '@/lib/paystack';
import { spacing, useThemeTokens } from '@/theme';

interface Props {
  data: HomeDashboardData;
  sending?: boolean;
  onSendPayout?: () => void;
}

export function HomeNextPayoutCard({ data, sending, onSendPayout }: Props) {
  const { t } = useTranslation();
  const { colors } = useThemeTokens();
  const { primaryGroup, currentCycle, totalPot } = data;

  if (!shouldShowNextPayoutOnHome(data)) return null;
  if (!primaryGroup || !currentCycle) return null;

  const payoutName = nextPayoutRecipientName(currentCycle, data.members);
  if (!payoutName) return null;

  const potAmount = totalPot ?? primaryGroup.contribution_amount * data.memberCount;
  const paystack = isPaystackConfigured();
  const canSend = data.isAdmin && !!onSendPayout;

  return (
    <Card variant="elevated" style={styles.card}>
      <Text variant="caption" color="secondary">
        {t('home.collectionReady')}
      </Text>
      <Text variant="headingSmall" numberOfLines={1} style={styles.name}>
        {payoutName}
      </Text>
      <Text variant="bodySmall" color="secondary">
        {formatNaira(potAmount)}
        {currentCycle.due_date ? ` · ${formatDate(currentCycle.due_date)}` : ''}
      </Text>

      {canSend ? (
        <Button
          title={paystack ? t('home.sendCollection') : t('home.recordCollection')}
          onPress={onSendPayout}
          loading={sending}
          style={styles.btn}
        />
      ) : null}

      {sending ? (
        <View style={styles.sendingRow}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { padding: spacing.md, marginBottom: spacing.md },
  name: { marginTop: 2, marginBottom: 4 },
  btn: { marginTop: spacing.sm, marginBottom: 0 },
  sendingRow: { marginTop: spacing.xs },
});
