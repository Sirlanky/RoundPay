import { Pressable, StyleSheet, Text, View } from 'react-native';
import { PlatformIcon } from '@/components/navigation/PlatformIcon';
import { useTranslation } from '@/contexts/LanguageContext';
import { primaryAlpha, spacing, useThemeTokens } from '@/theme';

type IconName = { ios: string; android: string; web: string };

interface Props {
  icon: IconName;
  label: string;
  subtitle?: string;
  value?: string;
  onPress?: () => void;
  comingSoon?: boolean;
  destructive?: boolean;
  isLast?: boolean;
  /** Tighter fintech-style row — no subtitle, smaller icon. */
  compact?: boolean;
}

export function ProfileSettingsRow({
  icon,
  label,
  subtitle,
  value,
  onPress,
  comingSoon,
  destructive,
  isLast,
  compact,
}: Props) {
  const { t } = useTranslation();
  const { colors, scheme } = useThemeTokens();
  const disabled = comingSoon || !onPress;
  const tint = destructive ? colors.error : colors.primary;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        compact ? styles.rowCompact : styles.row,
        !isLast && { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth },
        { opacity: pressed && !disabled ? 0.88 : comingSoon ? 0.55 : 1 },
      ]}>
      <View
        style={[
          compact ? styles.iconWrapCompact : styles.iconWrap,
          { backgroundColor: primaryAlpha(scheme, compact ? 8 : 12) },
        ]}>
        <PlatformIcon name={icon} size={compact ? 16 : 18} color={tint} />
      </View>
      <View style={styles.body}>
        <Text
          style={[
            compact ? styles.labelCompact : styles.label,
            { color: destructive ? colors.error : colors.textPrimary },
          ]}>
          {label}
        </Text>
        {!compact && subtitle ? (
          <Text style={[styles.subtitle, { color: colors.textSecondary }]} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {comingSoon ? (
        <Text style={[styles.comingSoon, { color: colors.textSecondary }]}>{t('common.comingSoon')}</Text>
      ) : value ? (
        <Text
          style={[compact ? styles.valueCompact : styles.value, { color: colors.textSecondary }]}
          numberOfLines={1}>
          {value}
        </Text>
      ) : onPress ? (
        <PlatformIcon
          name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
          color={colors.textSecondary}
          size={compact ? 12 : 14}
        />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  rowCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 13,
    paddingHorizontal: spacing.xs,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapCompact: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, minWidth: 0 },
  label: { fontSize: 15, fontWeight: '600' },
  labelCompact: { fontSize: 15, fontWeight: '500' },
  subtitle: { fontSize: 12, lineHeight: 17, marginTop: 2 },
  value: { fontSize: 13, fontWeight: '500', maxWidth: 120, textAlign: 'right' },
  valueCompact: { fontSize: 13, fontWeight: '400', maxWidth: 140, textAlign: 'right', flexShrink: 1 },
  comingSoon: { fontSize: 11, fontWeight: '600' },
});
