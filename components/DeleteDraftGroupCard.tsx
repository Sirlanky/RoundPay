import { SymbolView } from 'expo-symbols';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Card } from '@/components/ui';
import { radius, spacing, useThemeTokens } from '@/theme';

interface Props {
  groupName: string;
  onPress: () => void;
  loading?: boolean;
}

export function DeleteDraftGroupCard({ groupName, onPress, loading }: Props) {
  const { colors } = useThemeTokens();

  return (
    <Card variant="elevated" style={styles.wrap}>
      <Pressable
        onPress={onPress}
        disabled={loading}
        style={({ pressed }) => [styles.row, { opacity: pressed || loading ? 0.75 : 1 }]}>
        <View style={[styles.iconWrap, { backgroundColor: colors.error + '12' }]}>
          {loading ? (
            <ActivityIndicator color={colors.error} size="small" />
          ) : (
            <SymbolView
              name={{ ios: 'trash', android: 'delete', web: 'delete' } as never}
              tintColor={colors.error}
              size={18}
            />
          )}
        </View>
        <View style={styles.body}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Delete draft group</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]} numberOfLines={2}>
            Remove "{groupName}" for all members. This cannot be undone.
          </Text>
        </View>
        <SymbolView
          name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' } as never}
          tintColor={colors.textSecondary}
          size={14}
        />
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: spacing.lg, paddingVertical: spacing.xs, paddingHorizontal: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1 },
  title: { fontSize: 15, fontWeight: '600' },
  subtitle: { fontSize: 13, lineHeight: 18, marginTop: 2 },
});
