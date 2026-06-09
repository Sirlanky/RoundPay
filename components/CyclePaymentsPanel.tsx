import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Avatar } from '@/components/Avatar';
import { Button, Card } from '@/components/ui';
import { StatusBadge } from './StatusBadge';
import { useTranslation } from '@/contexts/LanguageContext';
import { formatNaira } from '@/lib/format';
import { memberDisplayName, type MemberWithProfile } from '@/lib/members';
import { isPaystackConfigured } from '@/lib/paystack';
import { paystackCollectContributions } from '@/lib/paystack-mode';
import type { Contribution, Cycle } from '@/lib/types';
import { spacing, useThemeTokens } from '@/theme';

interface Props {
  cycle: Cycle | null;
  contributions: Contribution[];
  memberByUserId: Map<string, MemberWithProfile>;
  currentUserId?: string;
  isAdmin: boolean;
  paidCount: number;
  onPay: (contributionId: string) => void;
  onRecordPayment: (contributionId: string) => void;
  recordingId?: string | null;
}

export function CyclePaymentsPanel({
  cycle,
  contributions,
  memberByUserId,
  currentUserId,
  isAdmin,
  paidCount,
  onPay,
  onRecordPayment,
  recordingId,
}: Props) {
  const { t } = useTranslation();
  const { colors } = useThemeTokens();
  const totalCount = contributions.length;
  const paystackReady = isPaystackConfigured();
  const cardPayEnabled = paystackCollectContributions && paystackReady;

  if (!cycle) {
    return null;
  }

  if (contributions.length === 0) {
    return (
      <Card style={styles.wrap}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Payments this cycle</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Cycle {cycle.cycle_number} — payment rows missing.
        </Text>
        <Text style={[styles.hint, { color: colors.textSecondary, marginTop: spacing.sm }]}>
          Run ADVANCE_CYCLE_FIX.sql in Supabase, then pull down to refresh.
        </Text>
      </Card>
    );
  }

  return (
    <Card style={styles.wrap}>
      <Text style={[styles.title, { color: colors.textPrimary }]}>Payments this cycle</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        {paidCount}/{totalCount} paid
      </Text>

      {contributions.map((c) => {
        const member = memberByUserId.get(c.user_id);
        const isYou = c.user_id === currentUserId;
        const isPaid = c.status === 'paid';
        const isPending = c.status === 'pending';
        const isRecording = recordingId === c.id;

        const name = member ? memberDisplayName(member) : 'Member';

        return (
          <View
            key={c.id}
            style={[styles.row, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <View style={styles.rowTop}>
              <View style={styles.avatarWrap}>
                <Avatar name={name} uri={member?.profile?.avatar_url} size={40} />
                <View
                  style={[
                    styles.dot,
                    {
                      backgroundColor: isPaid ? colors.success : colors.error,
                      borderColor: colors.background,
                    },
                  ]}
                />
              </View>
              <View style={styles.main}>
                <Text style={[styles.name, { color: colors.textPrimary }]}>
                  {name}
                  {isYou ? ' (you)' : ''}
                </Text>
                <Text style={[styles.amount, { color: colors.textSecondary }]}>
                  {formatNaira(c.amount)}
                  {isPaid ? ' · Paid' : ' · Awaiting payment'}
                </Text>
              </View>
              <StatusBadge status={isPaid ? 'paid' : 'pending'} />
            </View>

            {isPending && !isAdmin && isYou && cardPayEnabled ? (
              <View style={styles.actions}>
                <Button title="Pay now" onPress={() => onPay(c.id)} style={styles.actionBtn} />
              </View>
            ) : null}

            {isPending && !isAdmin && isYou && !cardPayEnabled ? (
              <Text style={[styles.hint, { color: colors.textSecondary }]}>
                {t('payments.transferToAdmin')}
              </Text>
            ) : null}

            {isPending && isAdmin ? (
              <Pressable
                onPress={() => onRecordPayment(c.id)}
                disabled={isRecording}
                style={[styles.recordBtn, { borderColor: colors.primary }]}>
                <Text style={{ color: colors.primary, fontWeight: '600', fontSize: 13 }}>
                  {isRecording ? 'Saving…' : 'Record payment'}
                </Text>
              </Pressable>
            ) : null}
          </View>
        );
      })}
    </Card>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.md },
  title: { fontSize: 17, fontWeight: '700', marginBottom: 4 },
  subtitle: { fontSize: 14, marginBottom: spacing.sm },
  row: {
    borderWidth: 1,
    borderRadius: 10,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatarWrap: { position: 'relative' },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    position: 'absolute',
    right: -1,
    bottom: -1,
  },
  main: { flex: 1 },
  name: { fontSize: 16, fontWeight: '600' },
  amount: { fontSize: 13, marginTop: 2 },
  actions: { marginTop: spacing.xs },
  actionBtn: { marginVertical: 0 },
  recordBtn: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: spacing.xs,
  },
  hint: { fontSize: 12, lineHeight: 17, marginTop: spacing.xs },
  adminHint: { fontSize: 13, lineHeight: 18, textAlign: 'center' },
});
