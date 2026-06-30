import { StyleSheet, View } from 'react-native';
import { Button, Card, Text } from '@/components/ui';
import { useTranslation } from '@/contexts/LanguageContext';
import type { CycleSwapRequest } from '@/lib/cycle-swap';
import { spacing } from '@/theme';

interface Props {
  requests: CycleSwapRequest[];
  currentUserId?: string;
  isAdmin: boolean;
  loading?: boolean;
  onRespond: (requestId: string, role: 'scheduled' | 'admin', approve: boolean) => void;
  onRequestSwap: () => void;
  canRequestSwap: boolean;
  swapBlockedReason?: 'eligible' | 'already_collected' | 'is_collector' | 'not_member' | 'pending_request' | 'inactive';
}

export function CycleSwapPanel({
  requests,
  currentUserId,
  isAdmin,
  loading,
  onRespond,
  onRequestSwap,
  canRequestSwap,
  swapBlockedReason,
}: Props) {
  const { t } = useTranslation();

  return (
    <Card variant="standard" style={styles.wrap}>
      <Text variant="headingSmall" style={styles.title}>
        {t('cycleSwap.title')}
      </Text>
      <Text variant="bodySmall" color="secondary" style={styles.subtitle}>
        {t('cycleSwap.subtitle')}
      </Text>

      {canRequestSwap ? (
        <Button
          title={t('cycleSwap.request')}
          variant="secondary"
          onPress={onRequestSwap}
          loading={loading}
          style={styles.requestBtn}
        />
      ) : swapBlockedReason === 'already_collected' ? (
        <Text variant="caption" color="secondary" style={styles.blockedHint}>
          {t('cycleSwap.alreadyCollected')}
        </Text>
      ) : null}

      {requests.map((req) => {
        const isScheduled = currentUserId === req.scheduledRecipientId;
        const showScheduled = isScheduled && !req.scheduledApprovedAt;
        const showAdmin = isAdmin && !req.adminApprovedAt;

        return (
          <View key={req.id} style={styles.requestCard}>
            <Text variant="bodyMedium" style={styles.requestLine}>
              {t('cycleSwap.line', {
                requester: req.requesterName,
                scheduled: req.scheduledRecipientName,
                round: req.cycleNumber,
              })}
            </Text>
            <View style={styles.badges}>
              <Text variant="caption" color={req.scheduledApprovedAt ? 'success' : 'secondary'}>
                {req.scheduledApprovedAt ? '✓ ' : '○ '}
                {t('cycleSwap.scheduledApproval')}
              </Text>
              <Text variant="caption" color={req.adminApprovedAt ? 'success' : 'secondary'}>
                {req.adminApprovedAt ? '✓ ' : '○ '}
                {t('cycleSwap.adminApproval')}
              </Text>
            </View>
            {showScheduled ? (
              <View style={styles.actions}>
                <Button
                  title={t('cycleSwap.approve')}
                  onPress={() => onRespond(req.id, 'scheduled', true)}
                  style={styles.actionBtn}
                />
                <Button
                  title={t('cycleSwap.decline')}
                  variant="secondary"
                  onPress={() => onRespond(req.id, 'scheduled', false)}
                  style={styles.actionBtn}
                />
              </View>
            ) : null}
            {showAdmin ? (
              <View style={styles.actions}>
                <Button
                  title={t('cycleSwap.approveAsAdmin')}
                  onPress={() => onRespond(req.id, 'admin', true)}
                  style={styles.actionBtn}
                />
                <Button
                  title={t('cycleSwap.decline')}
                  variant="secondary"
                  onPress={() => onRespond(req.id, 'admin', false)}
                  style={styles.actionBtn}
                />
              </View>
            ) : null}
          </View>
        );
      })}
    </Card>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.md },
  title: { marginBottom: spacing.xs },
  subtitle: { marginBottom: spacing.sm, lineHeight: 18 },
  requestBtn: { marginBottom: spacing.sm },
  blockedHint: { marginBottom: spacing.sm, lineHeight: 18 },
  requestCard: { marginTop: spacing.sm, gap: spacing.xs },
  requestLine: { fontWeight: '600', lineHeight: 20 },
  badges: { gap: 2 },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  actionBtn: { flex: 1, marginVertical: 0 },
});
