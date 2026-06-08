import { SymbolView } from 'expo-symbols';
import { StyleSheet, View } from 'react-native';
import { Card, Text } from '@/components/ui';
import type { HomeActivity } from '@/lib/home-dashboard';
import { formatDate } from '@/lib/format';
import { primaryAlpha, spacing, useThemeTokens } from '@/theme';

interface Props {
  activities: HomeActivity[];
  title?: string;
}

export function AdminActivityFeed({ activities, title }: Props) {
  const { colors, scheme } = useThemeTokens();

  if (!activities.length) return null;

  return (
    <View style={styles.wrap}>
      {title ? (
        <Text variant="headingSmall" style={styles.title}>
          {title}
        </Text>
      ) : null}
      <Card variant="elevated" style={styles.list}>
        {activities.map((item, index) => (
          <View
            key={item.id}
            style={[
              styles.row,
              index < activities.length - 1 && {
                borderBottomColor: colors.border,
                borderBottomWidth: StyleSheet.hairlineWidth,
              },
            ]}>
            <View style={[styles.icon, { backgroundColor: primaryAlpha(scheme, 12) }]}>
              <SymbolView
                name={
                  {
                    ios: item.type === 'payment' ? 'arrow.down.circle.fill' : 'arrow.up.circle.fill',
                    android: 'payments',
                    web: 'payments',
                  } as never
                }
                tintColor={colors.primary}
                size={18}
              />
            </View>
            <View style={styles.body}>
              <Text variant="bodyMedium">{item.label}</Text>
              <Text variant="caption" color="secondary">
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
  title: { marginBottom: spacing.sm },
  list: { paddingVertical: spacing.xs, paddingHorizontal: spacing.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1 },
});
