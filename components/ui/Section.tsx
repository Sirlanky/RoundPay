import { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { useThemeTokens } from '@/theme';
import { Text } from './Text';

interface Props {
  title: string;
  children: ReactNode;
  action?: ReactNode;
  style?: ViewStyle;
  /** Uppercase compact label (Profile-style). */
  compact?: boolean;
}

export function Section({ title, children, action, style, compact = false }: Props) {
  const theme = useThemeTokens();
  const { spacing } = theme;

  return (
    <View style={[styles.wrap, { marginBottom: spacing.sm }, style]}>
      <View style={styles.header}>
        {compact ? (
          <Text variant="label" color="secondary" style={styles.compactTitle}>
            {title}
          </Text>
        ) : (
          <Text variant="headingSmall" style={styles.title}>
            {title}
          </Text>
        )}
        {action}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    flex: 1,
  },
  compactTitle: {
    flex: 1,
    marginLeft: 4,
  },
});
