import { Pressable, StyleSheet, View } from 'react-native';
import { Button, Text } from '@/components/ui';
import { useTranslation } from '@/contexts/LanguageContext';
import { formatNaira, frequencyLabel } from '@/lib/format';
import {
  DEFAULT_PARKOUT_PAY_INS,
  parkoutCollectLabel,
  parkoutPreset,
  turnMoneyGross,
} from '@/lib/collection-mode';
import {
  monthlyTurnoverFromContribution,
  suggestContributionFromMonthlyTarget,
} from '@/lib/ajo-calculator';
import { parseContributionAmount } from '@/lib/group-validation';
import type { GroupFrequency } from '@/lib/types';
import { spacing, useThemeTokens } from '@/theme';

export type SetupMode = 'contribution' | 'monthly' | 'weekly_save_monthly';

interface Props {
  mode: SetupMode;
  onModeChange: (mode: SetupMode) => void;
  monthlyTarget: string;
  onMonthlyTargetChange: (value: string) => void;
  maxMembers: string;
  frequency: GroupFrequency;
  setupAmount: string;
  parkoutDuration: string;
  onApplyContribution: (amount: number) => void;
  onApplyParkout?: (params: {
    amount: number;
    frequency: GroupFrequency;
    payInsPerCycle: number;
  }) => void;
}

export function GroupSetupCalculator({
  mode,
  onModeChange,
  monthlyTarget,
  onMonthlyTargetChange,
  maxMembers,
  frequency,
  setupAmount,
  parkoutDuration,
  onApplyContribution,
  onApplyParkout,
}: Props) {
  const { t } = useTranslation();
  const { colors } = useThemeTokens();
  const members = parseInt(maxMembers.replace(/\D/g, ''), 10) || 0;
  const target = parseContributionAmount(monthlyTarget);
  const payInAmount = parseContributionAmount(setupAmount);
  const parkoutPayIns = parseInt(parkoutDuration.replace(/\D/g, ''), 10) || DEFAULT_PARKOUT_PAY_INS;

  const suggestion =
    target != null && members >= 2
      ? suggestContributionFromMonthlyTarget({
          monthlyPoolTarget: target,
          memberCount: members,
          frequency,
        })
      : null;

  const parkout =
    payInAmount != null && members >= 2 && mode === 'weekly_save_monthly'
      ? parkoutPreset({
          payInAmount,
          memberCount: members,
          frequency,
          payInsPerCycle: parkoutPayIns,
        })
      : null;

  return (
    <View style={styles.wrap}>
      <View style={[styles.modeRow, { borderColor: colors.border }]}>
        <ModeChip
          label={t('create.perPayment')}
          selected={mode === 'contribution'}
          onPress={() => onModeChange('contribution')}
          colors={colors}
        />
        <ModeChip
          label={t('create.monthlyTarget')}
          selected={mode === 'monthly'}
          onPress={() => onModeChange('monthly')}
          colors={colors}
        />
        <ModeChip
          label={t('create.weeklySaveMonthly')}
          selected={mode === 'weekly_save_monthly'}
          onPress={() => onModeChange('weekly_save_monthly')}
          colors={colors}
        />
      </View>

      {mode === 'weekly_save_monthly' ? (
        <Text variant="caption" color="secondary" style={styles.modeDesc}>
          {t('create.parkoutModeDesc')}
        </Text>
      ) : null}

      {mode === 'monthly' && suggestion ? (
        <View style={[styles.result, { backgroundColor: colors.surfaceSecondary }]}>
          <Text variant="bodySmall" color="secondary">
            {formatNaira(suggestion.contributionAmount)} each · {frequencyLabel(frequency, { lowercase: true })} ·{' '}
            {t('create.turnMoneyLine', { amount: formatNaira(suggestion.grossPerCycle) })}
          </Text>
          <Button
            title={t('create.useAmount', { amount: formatNaira(suggestion.contributionAmount) })}
            onPress={() => onApplyContribution(suggestion.contributionAmount)}
            style={styles.applyBtn}
          />
        </View>
      ) : null}

      {mode === 'weekly_save_monthly' && parkout ? (
        <View style={[styles.result, { backgroundColor: colors.surfaceSecondary }]}>
          <Text variant="bodySmall" color="secondary">
            {t('create.parkoutSummary', {
              amount: formatNaira(parkout.contributionAmount),
              freq: frequencyLabel(frequency, { lowercase: true }),
              parkout: parkoutCollectLabel(frequency, parkout.payInsPerCycle),
              memberTotal: formatNaira(parkout.memberRoundTotal),
              members,
              turnMoney: formatNaira(parkout.turnMoney),
            })}
          </Text>
          <Button
            title={t('create.useParkoutSetup', { amount: formatNaira(parkout.contributionAmount) })}
            onPress={() =>
              onApplyParkout?.({
                amount: parkout.contributionAmount,
                frequency: parkout.frequency,
                payInsPerCycle: parkout.payInsPerCycle,
              })
            }
            style={styles.applyBtn}
          />
        </View>
      ) : null}

      {mode === 'contribution' && members >= 2 ? (
        <Text variant="caption" color="secondary" style={styles.hint}>
          {t('create.monthlyTargetTip')}
        </Text>
      ) : null}
    </View>
  );
}

function ModeChip({
  label,
  selected,
  onPress,
  colors,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  colors: { primary: string; border: string };
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.modeChip,
        selected && { backgroundColor: colors.primary + '18', borderColor: colors.primary },
        { borderColor: colors.border },
      ]}>
      <Text variant="caption" style={{ fontWeight: selected ? '700' : '500', textAlign: 'center' }}>
        {label}
      </Text>
    </Pressable>
  );
}

export function contributionMonthlyHint(
  amount: number,
  maxMembers: number,
  frequency: GroupFrequency,
  formatHint: (amount: string) => string,
  payInsPerCycle = 1
): string | null {
  if (amount <= 0 || maxMembers < 2) return null;
  if (payInsPerCycle > 1) {
    return formatHint(formatNaira(turnMoneyGross(amount, maxMembers, payInsPerCycle)));
  }
  const turnover = monthlyTurnoverFromContribution({
    contributionAmount: amount,
    memberCount: maxMembers,
    frequency,
  });
  return formatHint(formatNaira(turnover));
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.sm },
  modeRow: { flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.sm },
  modeChip: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 44,
  },
  modeDesc: { lineHeight: 18, marginBottom: spacing.sm },
  result: { borderRadius: 10, padding: spacing.sm, gap: spacing.sm },
  applyBtn: { marginVertical: 0 },
  hint: { lineHeight: 18 },
});
