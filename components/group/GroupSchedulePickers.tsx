import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Input } from '@/components/Input';
import { useTranslation } from '@/contexts/LanguageContext';
import {
  COLLECTION_FREQUENCY_OPTIONS,
  PAYOUT_FREQUENCY_OPTIONS,
  type CollectionFrequencyPreset,
  type GroupScheduleInput,
  type PayoutFrequencyPreset,
} from '@/lib/group-schedule';
import { spacing, useThemeTokens } from '@/theme';

interface Props {
  value: GroupScheduleInput;
  customDaysRaw: string;
  onChange: (patch: Partial<GroupScheduleInput>) => void;
  onCustomDaysChange: (raw: string) => void;
  disabled?: boolean;
}

function SegmentChip({
  label,
  selected,
  onPress,
  disabled,
  colors,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  disabled?: boolean;
  colors: { primary: string; border: string; textPrimary: string };
}) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.chip,
        { borderColor: colors.border, opacity: disabled ? 0.5 : 1 },
        selected && { backgroundColor: colors.primary + '18', borderColor: colors.primary },
      ]}>
      <Text
        style={{
          color: selected ? colors.primary : colors.textPrimary,
          fontWeight: selected ? '700' : '500',
          fontSize: 13,
          textAlign: 'center',
        }}>
        {label}
      </Text>
    </Pressable>
  );
}

export function GroupSchedulePickers({
  value,
  customDaysRaw,
  onChange,
  onCustomDaysChange,
  disabled,
}: Props) {
  const { t } = useTranslation();
  const { colors } = useThemeTokens();
  const showCustom = value.collectionFrequency === 'custom';

  return (
    <View style={[styles.wrap, { opacity: disabled ? 0.5 : 1 }]}>
      <Text style={[styles.heading, { color: colors.textPrimary }]}>
        {t('create.collectionFrequencyLabel')}
      </Text>
      <Text style={[styles.subheading, { color: colors.textSecondary }]}>
        {t('create.collectionFrequencyHint')}
      </Text>
      <View style={styles.chipGrid}>
        {COLLECTION_FREQUENCY_OPTIONS.map((opt) => (
          <SegmentChip
            key={opt.value}
            label={t(opt.labelKey)}
            selected={value.collectionFrequency === opt.value}
            disabled={disabled}
            colors={colors}
            onPress={() =>
              onChange({
                collectionFrequency: opt.value as CollectionFrequencyPreset,
                customCollectionDays: opt.value === 'custom' ? value.customCollectionDays ?? 5 : null,
              })
            }
          />
        ))}
      </View>

      {showCustom ? (
        <View style={styles.customBlock}>
          <Input
            label={t('create.customCollectionDaysLabel')}
            value={customDaysRaw}
            onChangeText={onCustomDaysChange}
            keyboardType="number-pad"
            placeholder="5"
          />
          <Text style={[styles.customHint, { color: colors.textSecondary }]}>
            {t('create.customCollectionDaysHint')}
          </Text>
        </View>
      ) : null}

      <Text style={[styles.heading, styles.payoutHeading, { color: colors.textPrimary }]}>
        {t('create.payoutFrequencyLabel')}
      </Text>
      <Text style={[styles.subheading, { color: colors.textSecondary }]}>
        {t('create.payoutFrequencyHint')}
      </Text>
      <View style={styles.payoutRow}>
        {PAYOUT_FREQUENCY_OPTIONS.map((opt) => (
          <SegmentChip
            key={opt.value}
            label={t(opt.labelKey)}
            selected={value.payoutFrequency === opt.value}
            disabled={disabled}
            colors={colors}
            onPress={() => onChange({ payoutFrequency: opt.value as PayoutFrequencyPreset })}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.sm },
  heading: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  subheading: { fontSize: 12, lineHeight: 17, marginBottom: spacing.sm },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  payoutRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    minWidth: '47%',
    flexGrow: 1,
  },
  customBlock: { marginBottom: spacing.sm },
  customHint: { fontSize: 12, lineHeight: 17, marginTop: -spacing.xs },
  payoutHeading: { marginTop: spacing.md },
});
