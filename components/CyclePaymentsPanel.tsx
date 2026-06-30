import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Avatar } from '@/components/Avatar';
import { Button, Card } from '@/components/ui';
import { StatusBadge } from './StatusBadge';
import { useTranslation } from '@/contexts/LanguageContext';
import { formatNaira } from '@/lib/format';
import { memberDisplayName, type MemberWithProfile } from '@/lib/members';
import { paymentMethodLabel } from '@/lib/payment-methods';
import { isPaystackConfigured } from '@/lib/paystack';
import { paystackCollectContributions } from '@/lib/paystack-mode';
import type { Contribution, Cycle } from '@/lib/types';
import type { TranslationKey } from '@/lib/i18n/keys';
import { spacing, useThemeTokens } from '@/theme';

interface Props {
  cycle: Cycle | null;
  contributions: Contribution[];
  memberByUserId: Map<string, MemberWithProfile>;
  currentUserId?: string;
  isAdmin: boolean;
  paidCount: number;
  payInsPerCycle?: number;
  onPay: (contributionId: string) => void;
  onRecordPayment: (contributionId: string) => void;
  onMessage?: (userId: string) => void;
  adminUserId?: string;
  recordingId?: string | null;
}

export function CyclePaymentsPanel({
  cycle,
  contributions,
  memberByUserId,
  currentUserId,
  isAdmin,
  paidCount,
  payInsPerCycle = 1,
  onPay,
  onRecordPayment,
  onMessage,
  adminUserId,
  recordingId,
}: Props) {
  const { t } = useTranslation();
  const { colors } = useThemeTokens();
  const totalCount = contributions.length;
  const paystackReady = isPaystackConfigured();
  const cardPayEnabled = paystackCollectContributions && paystackReady;
  const weeklyMode = payInsPerCycle > 1;

  const byMember = useMemo(() => {
    const map = new Map<string, Contribution[]>();
    for (const c of contributions) {
      const list = map.get(c.user_id) ?? [];
      list.push(c);
      map.set(c.user_id, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => (a.installment_number ?? 1) - (b.installment_number ?? 1));
    }
    return map;
  }, [contributions]);

  if (!cycle) {
    return null;
  }

  if (contributions.length === 0) {
    return (
      <Card style={styles.wrap}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>{t('cycle.paymentsThisRound')}</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {t('cycle.paymentsMissing', { n: cycle.cycle_number })}
        </Text>
      </Card>
    );
  }

  return (
    <Card style={styles.wrap}>
      <Text style={[styles.title, { color: colors.textPrimary }]}>
        {weeklyMode ? t('cycle.weeklyPayInsThisMonth') : t('cycle.paymentsThisRound')}
      </Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        {weeklyMode
          ? t('cycle.weeklyPaidProgress', { paid: paidCount, total: totalCount })
          : t('cycle.paidProgress', { paid: paidCount, total: totalCount })}
      </Text>

      {[...byMember.entries()].map(([userId, rows]) => {
        const member = memberByUserId.get(userId);
        const isYou = userId === currentUserId;
        const name = member ? memberDisplayName(member) : 'Member';
        const paidRows = rows.filter((r) => r.status === 'paid').length;
        const totalDue = rows.reduce((sum, r) => sum + r.amount, 0);
        const paidAmount = rows.filter((r) => r.status === 'paid').reduce((sum, r) => sum + r.amount, 0);

        return (
          <View
            key={userId}
            style={[styles.memberBlock, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <View style={styles.rowTop}>
              <View style={styles.avatarWrap}>
                <Avatar name={name} uri={member?.profile?.avatar_url} size={40} />
              </View>
              <View style={styles.main}>
                <Text style={[styles.name, { color: colors.textPrimary }]}>
                  {name}
                  {isYou ? ' (you)' : ''}
                </Text>
                <Text style={[styles.amount, { color: colors.textSecondary }]}>
                  {weeklyMode
                    ? t('cycle.memberWeekProgress', {
                        paid: paidRows,
                        total: rows.length,
                        amount: formatNaira(paidAmount),
                        due: formatNaira(totalDue),
                      })
                    : `${formatNaira(totalDue)}${paidRows === rows.length ? ' · Paid' : ' · Pending'}`}
                </Text>
              </View>
              <StatusBadge status={paidRows === rows.length ? 'paid' : 'pending'} />
            </View>

            {weeklyMode
              ? rows.map((c) => (
                  <ContributionRow
                    key={c.id}
                    contribution={c}
                    week={c.installment_number ?? 1}
                    isYou={isYou}
                    isAdmin={isAdmin}
                    isRecording={recordingId === c.id}
                    cardPayEnabled={cardPayEnabled}
                    name={name}
                    onPay={onPay}
                    onRecordPayment={onRecordPayment}
                    onMessage={onMessage}
                    adminUserId={adminUserId}
                    t={t}
                    colors={colors}
                  />
                ))
              : rows.map((c) => (
                  <ContributionRow
                    key={c.id}
                    contribution={c}
                    isYou={isYou}
                    isAdmin={isAdmin}
                    isRecording={recordingId === c.id}
                    cardPayEnabled={cardPayEnabled}
                    name={name}
                    onPay={onPay}
                    onRecordPayment={onRecordPayment}
                    onMessage={onMessage}
                    adminUserId={adminUserId}
                    t={t}
                    colors={colors}
                  />
                ))}
          </View>
        );
      })}
    </Card>
  );
}

function ContributionRow({
  contribution: c,
  week,
  isYou,
  isAdmin,
  isRecording,
  cardPayEnabled,
  name,
  onPay,
  onRecordPayment,
  onMessage,
  adminUserId,
  t,
  colors,
}: {
  contribution: Contribution;
  week?: number;
  isYou: boolean;
  isAdmin: boolean;
  isRecording: boolean;
  cardPayEnabled: boolean;
  name: string;
  onPay: (id: string) => void;
  onRecordPayment: (id: string) => void;
  onMessage?: (userId: string) => void;
  adminUserId?: string;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
  colors: { primary: string; textSecondary: string; border: string };
}) {
  const isPaid = c.status === 'paid';
  const isPending = c.status === 'pending';
  const label =
    week != null
      ? t('cycle.weekPayIn', { week, amount: formatNaira(c.amount) })
      : formatNaira(c.amount);

  if (isPaid) {
    return (
      <Text style={[styles.weekLine, { color: colors.textSecondary }]}>
        ✓ {label} · {paymentMethodLabel(c.payment_method, t)}
      </Text>
    );
  }

  return (
    <View style={[styles.weekRow, { borderTopColor: colors.border }]}>
      <Text style={[styles.weekLine, { color: colors.textSecondary }]}>{label}</Text>
      {isPending && !isAdmin && isYou && cardPayEnabled ? (
        <Button title="Pay now" onPress={() => onPay(c.id)} style={styles.actionBtn} />
      ) : null}
      {isPending && !isAdmin && isYou && !cardPayEnabled ? (
        <Text style={[styles.hint, { color: colors.textSecondary }]}>{t('payments.transferToAdmin')}</Text>
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
      {isPending && !isAdmin && isYou && onMessage && adminUserId ? (
        <Pressable onPress={() => onMessage(adminUserId)} style={styles.messageLink}>
          <Text style={{ color: colors.primary, fontWeight: '600', fontSize: 13 }}>
            {t('messages.sendTo', { name: t('messages.roleAdmin') })}
          </Text>
        </Pressable>
      ) : null}
      {isPending && isAdmin && onMessage ? (
        <Pressable onPress={() => onMessage(c.user_id)} style={styles.messageLink}>
          <Text style={{ color: colors.primary, fontWeight: '600', fontSize: 13 }}>
            {t('messages.sendTo', { name })}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.md },
  title: { fontSize: 17, fontWeight: '700', marginBottom: 4 },
  subtitle: { fontSize: 14, marginBottom: spacing.sm },
  memberBlock: {
    borderWidth: 1,
    borderRadius: 10,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatarWrap: { position: 'relative' },
  main: { flex: 1 },
  name: { fontSize: 16, fontWeight: '600' },
  amount: { fontSize: 13, marginTop: 2 },
  weekRow: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: spacing.sm, gap: spacing.xs },
  weekLine: { fontSize: 13 },
  actionBtn: { marginVertical: 0 },
  recordBtn: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  hint: { fontSize: 12, lineHeight: 17 },
  messageLink: { alignSelf: 'flex-start' },
});
