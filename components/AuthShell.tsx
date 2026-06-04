import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Colors, { brand } from '@/constants/Colors';
import { spacing, typography } from '@/constants/theme';
import { Screen } from './Screen';
import { useColorScheme } from './useColorScheme';

interface Props {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  keyboard?: boolean;
}

export function AuthShell({ children, title, subtitle, keyboard }: Props) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  return (
    <Screen keyboard={keyboard} contentStyle={styles.content}>
      <View style={styles.brandBlock}>
        <View style={[styles.logoBadge, { backgroundColor: brand.primary }]}>
          <Text style={styles.logoLetter}>A</Text>
        </View>
        <Text style={[styles.brandName, { color: brand.primary }]}>Ajo Esusu</Text>
        <Text style={[styles.tagline, { color: colors.textSecondary }]}>
          Save together. Collect your turn.
        </Text>
      </View>
      {(title || subtitle) && (
        <View style={styles.intro}>
          {title ? <Text style={[styles.title, { color: colors.text }]}>{title}</Text> : null}
          {subtitle ? (
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
          ) : null}
        </View>
      )}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {children}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: spacing.md },
  brandBlock: { alignItems: 'center', marginBottom: spacing.lg },
  logoBadge: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  logoLetter: { color: '#fff', fontSize: 28, fontWeight: '800' },
  brandName: { ...typography.hero, fontSize: 28 },
  tagline: { ...typography.body, marginTop: spacing.xs, textAlign: 'center' },
  intro: { marginBottom: spacing.md },
  title: { ...typography.heading, fontSize: 20 },
  subtitle: { ...typography.caption, marginTop: spacing.xs, lineHeight: 20 },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: spacing.lg,
  },
});
