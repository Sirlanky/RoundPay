import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from './Button';
import { Card } from './Card';
import { StatusBadge } from './StatusBadge';
import { useColorScheme } from './useColorScheme';
import Colors, { brand } from '@/constants/Colors';
import { formatNaira } from '@/lib/format';
import { memberDisplayName, type MemberWithProfile } from '@/lib/members';
import { isPaystackConfigured } from '@/lib/paystack';
import type { Contribution, Cycle } from '@/lib/types';
import { spacing } from '@/constants/theme';

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
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const totalCount = contributions.length;
  const pendingCount = totalCount - paidCount;
  const allPaid = totalCount > 0 && pendingCount === 0;
  const paystackReady = isPaystackConfigured();

  if (!cycle) {
    return null;
  }

  if (contributions.length === 0) {
    return (
      <Card style={styles.wrap}>
        <Text style={[styles.title, { color: colors.text }]}>Payments this cycle</Text>
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
      <Text style={[styles.title, { color: colors.text }]}>Payments this cycle</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        {paidCount} paid · {pendingCount} waiting
        {allPaid ? ' · Ready for payout' : ''}
      </Text>

      {isAdmin ? (
        <Text style={[styles.adminHint, { color: colors.textSecondary, marginBottom: spacing.sm }]}>
          Only you can record payments — members cannot mark themselves paid.
        </Text>
      ) : (
        <Text style={[styles.adminHint, { color: colors.textSecondary, marginBottom: spacing.sm }]}>
          The admin records each payment after they receive it.
        </Text>
      )}

      {contributions.map((c) => {
        const member = memberByUserId.get(c.user_id);
        const isYou = c.user_id === currentUserId;
        const isPaid = c.status === 'paid';
        const isPending = c.status === 'pending';
        const isRecording = recordingId === c.id;

        return (
          <View
            key={c.id}
            style={[styles.row, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <View style={[styles.dot, { backgroundColor: isPaid ? colors.success : colors.error }]} />
            <View style={styles.main}>
              <Text style={[styles.name, { color: colors.text }]}>
                {member ? memberDisplayName(member) : 'Member'}
                {isYou ? ' (you)' : ''}
              </Text>
              <Text style={[styles.amount, { color: colors.textSecondary }]}>
                {formatNaira(c.amount)}
                {isPaid ? ' · Paid' : ' · Awaiting payment'}
              </Text>
            </View>
            <StatusBadge status={isPaid ? 'paid' : 'pending'} />

            {isPending && !isAdmin && isYou && paystackReady ? (
              <View style={styles.actions}>
                <Button title="Pay now (Paystack)" onPress={() => onPay(c.id)} style={styles.actionBtn} />
              </View>
            ) : null}

            {isPending && !isAdmin && (!isYou || !paystackReady) ? (
              <Text style={[styles.hint, { color: colors.textSecondary }]}>
                {isYou ? 'Pay the admin — they will record your payment here.' : 'Waiting for admin to record payment.'}
              </Text>
            ) : null}

            {isPending && isAdmin ? (
              <Pressable
                onPress={() => onRecordPayment(c.id)}
                disabled={isRecording}
                style={[styles.recordBtn, { borderColor: brand.primary }]}>
                <Text style={{ color: brand.primary, fontWeight: '600', fontSize: 13 }}>
                  {isRecording ? 'Saving…' : 'Record payment'}
                </Text>
              </Pressable>
            ) : null}
          </View>
        );
      })}

      {isAdmin && allPaid && cycle.status === 'completed' ? (
        <Text style={[styles.adminHint, { color: brand.primary }]}>
          Everyone has paid. Tap Record payout sent below.
        </Text>
      ) : null}
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
  dot: { width: 8, height: 8, borderRadius: 4, position: 'absolute', left: spacing.md, top: spacing.md + 6 },
  main: { marginLeft: spacing.md },
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
