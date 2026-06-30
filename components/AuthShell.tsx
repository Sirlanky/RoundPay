import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Screen } from '@/components/ui/Screen';
import { primaryAlpha, spacing, useThemeTokens } from '@/theme';
import { Text } from '@/components/ui';

interface Props {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  keyboard?: boolean;
  footer?: ReactNode;
}

export function AuthShell({ children, title, subtitle, keyboard, footer }: Props) {
  const { colors, spacing, radius, scheme, shadow } = useThemeTokens();

  return (
    <Screen
      keyboard={keyboard}
      contentStyle={footer ? [styles.content, styles.contentWithFooter] : styles.content}>
      <View style={styles.brandBlock}>
        <View
          style={[
            styles.logoBadge,
            {
              backgroundColor: colors.primary,
              borderRadius: radius.xl,
            },
            shadow('medium'),
          ]}>
          <View style={[styles.logoGlow, { backgroundColor: primaryAlpha(scheme, 32) }]} />
          <Text variant="display" color="inverse" style={styles.logoLetter}>
            R
          </Text>
        </View>
        <Text variant="display" style={styles.brandName}>
          RoundPay
        </Text>
        <Text variant="bodySmall" color="secondary" style={styles.tagline}>
          Save together. Collect your turn.
        </Text>
      </View>
      {(title || subtitle) && (
        <View style={styles.intro}>
          {title ? (
            <Text variant="headingMedium" style={{ color: colors.textPrimary }}>
              {title}
            </Text>
          ) : null}
          {subtitle ? (
            <Text variant="bodyMedium" color="secondary" style={styles.subtitle}>
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
            borderRadius: radius.xl,
            padding: spacing.lg,
          },
          shadow('small'),
        ]}>
        {children}
      </View>
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: spacing.md },
  contentWithFooter: { flexGrow: 1 },
  footer: {
    marginTop: 'auto',
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    alignItems: 'center',
  },
  brandBlock: { alignItems: 'center', marginBottom: spacing.lg },
  logoBadge: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  logoGlow: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    top: -20,
    right: -20,
  },
  logoLetter: { fontWeight: '800', fontSize: 30 },
  brandName: { fontWeight: '800', letterSpacing: -0.5, fontSize: 26 },
  tagline: { marginTop: 4, textAlign: 'center' },
  intro: { marginBottom: spacing.md, paddingHorizontal: spacing.xs },
  subtitle: { marginTop: spacing.xs, lineHeight: 22, textAlign: 'center' },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
  },
});
