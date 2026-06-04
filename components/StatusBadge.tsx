import { StyleSheet, Text, View } from 'react-native';
import { useColorScheme } from './useColorScheme';

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  draft: { bg: '#FFF3E0', text: '#E65100' },
  active: { bg: '#E8F5E9', text: '#2E7D32' },
  completed: { bg: '#E3F2FD', text: '#1565C0' },
  pending: { bg: '#FFF8E1', text: '#F57F17' },
  paid: { bg: '#E8F5E9', text: '#2E7D32' },
  collecting: { bg: '#E8F5E9', text: '#2E7D32' },
  paid_out: { bg: '#E3F2FD', text: '#1565C0' },
  failed: { bg: '#FFEBEE', text: '#C62828' },
};

interface Props {
  status: string;
}

export function StatusBadge({ status }: Props) {
  const scheme = useColorScheme() ?? 'light';
  const key = status.toLowerCase();
  const palette = STATUS_COLORS[key] ?? { bg: '#EEE', text: '#333' };
  const bg = scheme === 'dark' ? palette.text + '33' : palette.bg;
  const text = scheme === 'dark' ? palette.bg : palette.text;

  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.text, { color: text }]}>{status.replace('_', ' ')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  text: { fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
});
