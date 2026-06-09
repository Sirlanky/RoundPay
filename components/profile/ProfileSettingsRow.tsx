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
        styles.row,
        !isLast && { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth },
        { opacity: pressed && !disabled ? 0.88 : comingSoon ? 0.55 : 1 },
      ]}>
      <View style={[styles.iconWrap, { backgroundColor: primaryAlpha(scheme, 12) }]}>
        <PlatformIcon name={icon} size={18} color={tint} />
      </View>
      <View style={styles.body}>
        <Text style={[styles.label, { color: destructive ? colors.error : colors.textPrimary }]}>{label}</Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: colors.textSecondary }]} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {comingSoon ? (
        <Text style={[styles.comingSoon, { color: colors.textSecondary }]}>{t('common.comingSoon')}</Text>
      ) : value ? (
        <Text style={[styles.value, { color: colors.textSecondary }]}>{value}</Text>
      ) : onPress ? (
        <PlatformIcon
          name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
          color={colors.textSecondary}
          size={14}
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
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1 },
  label: { fontSize: 15, fontWeight: '600' },
  subtitle: { fontSize: 12, lineHeight: 17, marginTop: 2 },
  value: { fontSize: 13, fontWeight: '500', maxWidth: 120, textAlign: 'right' },
  comingSoon: { fontSize: 11, fontWeight: '600' },
});
