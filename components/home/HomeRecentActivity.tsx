import { SymbolView } from 'expo-symbols';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from '@/components/Card';
import { HomeSectionTitle } from './HomeSectionTitle';
import { useColorScheme } from '@/components/useColorScheme';
import Colors, { brand } from '@/constants/Colors';
import { formatDate } from '@/lib/format';
import type { HomeDashboardData } from '@/lib/home-dashboard';
import { spacing } from '@/constants/theme';

interface Props {
  activities: HomeDashboardData['recentActivity'];
}

export function HomeRecentActivity({ activities }: Props) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  if (activities.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <HomeSectionTitle title="Recent activity" />
      <Card elevated style={styles.list}>
        {activities.map((item, index) => (
          <View
            key={item.id}
            style={[
              styles.row,
              index < activities.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: 1 },
            ]}>
            <View style={[styles.dot, { backgroundColor: brand.primary + '33' }]}>
              <SymbolView
                name={
                  {
                    ios: item.type === 'payment' ? 'arrow.down.circle.fill' : 'arrow.up.circle.fill',
                    android: 'payments',
                    web: 'payments',
                  } as never
                }
                tintColor={brand.primary}
                size={18}
              />
            </View>
            <View style={styles.body}>
              <Text style={[styles.label, { color: colors.text }]}>{item.label}</Text>
              <Text style={[styles.time, { color: colors.textSecondary }]}>
                {formatDate(item.timestamp)}
              </Text>
            </View>
          </View>
        ))}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.md },
  list: { paddingVertical: spacing.xs, paddingHorizontal: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, gap: spacing.sm },
  dot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1 },
  label: { fontSize: 14, fontWeight: '500' },
  time: { fontSize: 12, marginTop: 2 },
});
