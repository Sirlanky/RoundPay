import { StyleSheet, View } from 'react-native';
import { useThemeTokens } from '@/theme';
import { Text } from './Text';

export type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral';

interface Props {
  label: string;
  variant?: BadgeVariant;
}

export function Badge({ label, variant = 'neutral' }: Props) {
  const theme = useThemeTokens();
  const { colors, radius } = theme;

  const palette = {
    success: { bg: colors.successSurface, fg: colors.success },
    warning: { bg: colors.warningSurface, fg: colors.warning },
    error: { bg: colors.errorSurface, fg: colors.error },
    info: { bg: colors.infoSurface, fg: colors.info },
    neutral: { bg: colors.surfaceSecondary, fg: colors.textSecondary },
  }[variant];

  return (
    <View style={[styles.badge, { backgroundColor: palette.bg, borderRadius: radius.sm }]}>
      <Text variant="caption" color="primary" style={{ color: palette.fg, fontWeight: '600', textTransform: 'capitalize' }}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
});

export function statusToBadgeVariant(status: string): BadgeVariant {
  const key = status.toLowerCase();
  switch (key) {
    case 'draft':
    case 'pending':
      return 'warning';
    case 'active':
    case 'collecting':
    case 'paid':
      return 'success';
    case 'completed':
    case 'paid_out':
      return 'info';
    case 'failed':
      return 'error';
    default:
      return 'neutral';
  }
}

export function StatusBadge({ status }: { status: string }) {
  const label = status.replace(/_/g, ' ');
  return <Badge label={label} variant={statusToBadgeVariant(status)} />;
}
