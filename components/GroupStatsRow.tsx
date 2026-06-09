import { Pressable, StyleSheet, Text, View } from 'react-native';
import { PlatformIcon } from '@/components/navigation/PlatformIcon';
import { useTranslation } from '@/contexts/LanguageContext';
import { spacing, useThemeTokens, type ThemeColors } from '@/theme';

interface Props {
  active: number;
  draft: number;
  completed: number;
  onPressDraft?: () => void;
  onPressHistory?: () => void;
}

export function GroupStatsRow({ active, draft, completed, onPressDraft, onPressHistory }: Props) {
  const { t } = useTranslation();
  const { colors } = useThemeTokens();

  return (
    <View style={styles.row}>
      <View style={[styles.chip, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.value, { color: colors.primary }]}>{active}</Text>
        <Text style={[styles.label, { color: colors.textSecondary }]}>{t('groups.active')}</Text>
      </View>

      <StatChip
        label={t('groups.settingUp')}
        value={draft}
        accent="#E65100"
        colors={colors}
        tappable={draft > 0}
        onPress={onPressDraft}
      />

      <StatChip
        label={t('groups.history')}
        value={completed}
        accent="#1565C0"
        colors={colors}
        tappable={completed > 0}
        onPress={onPressHistory}
      />
    </View>
  );
}

function StatChip({
  label,
  value,
  accent,
  colors,
  tappable,
  onPress,
}: {
  label: string;
  value: number;
  accent: string;
  colors: ThemeColors;
  tappable: boolean;
  onPress?: () => void;
}) {
  const content = (
    <>
      <Text style={[styles.value, { color: accent }]}>{value}</Text>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      {tappable ? (
        <PlatformIcon name={{ ios: 'chevron.up', android: 'expand_less', web: 'expand_less' }} color={colors.textSecondary} size={12} />
      ) : null}
    </>
  );

  if (!tappable || !onPress) {
    return (
      <View style={[styles.chip, styles.chipMuted, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {content}
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        styles.chipTappable,
        {
          backgroundColor: colors.surface,
          borderColor: accent + '55',
          opacity: pressed ? 0.85 : 1,
        },
      ]}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  chip: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    alignItems: 'center',
    gap: 2,
  },
  chipTappable: { borderWidth: 1.5 },
  chipMuted: { opacity: 0.55 },
  value: { fontSize: 22, fontWeight: '800' },
  label: { fontSize: 11, fontWeight: '500', textAlign: 'center' },
});
