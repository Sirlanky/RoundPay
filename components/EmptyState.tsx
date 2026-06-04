import { StyleSheet, Text, View } from 'react-native';
import Colors from '@/constants/Colors';
import { spacing } from '@/constants/theme';
import { useColorScheme } from './useColorScheme';

interface Props {
  title: string;
  message: string;
}

export function EmptyState({ title, message }: Props) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: spacing.xl,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  title: { fontSize: 17, fontWeight: '600', marginBottom: spacing.sm },
  message: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
});
