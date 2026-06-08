import { StyleSheet, View } from 'react-native';
import { AdminStatCard } from './AdminStatCard';
import { spacing } from '@/theme';

interface StatItem {
  label: string;
  value: string;
  hint?: string;
  accent?: 'default' | 'success' | 'warning' | 'error';
  onPress?: () => void;
}

interface Props {
  items: StatItem[];
}

export function AdminKpiGrid({ items }: Props) {
  return (
    <View style={styles.grid}>
      {items.map((item) => (
        <AdminStatCard key={item.label} {...item} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});
