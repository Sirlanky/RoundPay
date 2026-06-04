import { StyleSheet, Text, View } from 'react-native';
import Colors from '@/constants/Colors';
import { spacing, typography } from '@/constants/theme';
import { useColorScheme } from './useColorScheme';

interface Props {
  title: string;
  subtitle?: string;
  large?: boolean;
}

export function ScreenHeader({ title, subtitle, large }: Props) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  return (
    <View style={styles.wrap}>
      <Text
        style={[
          large ? styles.large : styles.title,
          { color: colors.text },
        ]}>
        {title}
      </Text>
      {subtitle ? (
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.lg, marginTop: spacing.sm },
  large: { ...typography.hero, marginBottom: spacing.xs },
  title: { ...typography.title, marginBottom: spacing.xs },
  subtitle: { ...typography.body, lineHeight: 22 },
});
