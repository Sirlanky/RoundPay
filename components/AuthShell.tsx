import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Screen } from '@/components/ui/Screen';
import { useThemeTokens } from '@/theme';

interface Props {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  keyboard?: boolean;
}

export function AuthShell({ children, title, subtitle, keyboard }: Props) {
  const { colors, spacing, radius, typography } = useThemeTokens();

  return (
    <Screen keyboard={keyboard} contentStyle={styles.content}>
      <View style={styles.brandBlock}>
        <View style={[styles.logoBadge, { backgroundColor: colors.primary, borderRadius: radius.lg }]}>
          <Text style={[typography.display, styles.logoLetter, { color: colors.textInverse, fontSize: 28 }]}>
            R
          </Text>
        </View>
        <Text style={[typography.display, styles.brandName, { color: colors.primary, fontSize: 28 }]}>
          RoundPay
        </Text>
        <Text style={[typography.bodySmall, styles.tagline, { color: colors.textSecondary }]}>
          Save together. Collect your turn.
        </Text>
      </View>
      {(title || subtitle) && (
        <View style={styles.intro}>
          {title ? (
            <Text style={[typography.headingMedium, { color: colors.textPrimary }]}>{title}</Text>
          ) : null}
          {subtitle ? (
            <Text style={[typography.bodySmall, styles.subtitle, { color: colors.textSecondary }]}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      )}
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderRadius: radius.lg,
            padding: spacing.lg,
          },
        ]}>
        {children}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 16 },
  brandBlock: { alignItems: 'center', marginBottom: 24 },
  logoBadge: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoLetter: { fontWeight: '800' },
  brandName: { fontWeight: '800' },
  tagline: { marginTop: 4, textAlign: 'center' },
  intro: { marginBottom: 16 },
  subtitle: { marginTop: 4, lineHeight: 20 },
  card: {
    borderWidth: 1,
  },
});
