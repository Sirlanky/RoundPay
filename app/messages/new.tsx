import { useRouter, type Href } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Avatar } from '@/components/Avatar';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/ui';
import { fetchMessageableMembers, type MessageableMember } from '@/lib/messages';
import { spacing, useThemeTokens } from '@/theme';

export default function NewMessageScreen() {
  const router = useRouter();
  const { colors } = useThemeTokens();

  const [members, setMembers] = useState<MessageableMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const list = await fetchMessageableMembers();
        if (active) setMembers(list);
      } catch {
        if (active) setMembers([]);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return members;
    return members.filter((m) => (m.fullName ?? '').toLowerCase().includes(q));
  }, [members, query]);

  if (loading) {
    return (
      <Screen contentStyle={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </Screen>
    );
  }

  return (
    <Screen contentStyle={styles.content}>
      <View
        style={[styles.searchWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <TextInput
          style={[styles.search, { color: colors.textPrimary }]}
          placeholder="Search members"
          placeholderTextColor={colors.textMuted}
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {!members.length ? (
        <EmptyState
          title="No members yet"
          message="Join or create a savings group to message other members."
        />
      ) : !filtered.length ? (
        <Text variant="bodySmall" color="secondary" style={styles.noMatch}>
          No members match “{query.trim()}”.
        </Text>
      ) : (
        filtered.map((m) => {
          const name = m.fullName?.trim() || 'Member';
          return (
            <Pressable
              key={m.id}
              onPress={() => router.replace(`/messages/${m.id}` as Href)}
              style={({ pressed }) => [
                styles.row,
                { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.85 : 1 },
              ]}>
              <Avatar name={name} uri={m.avatarUrl} size={44} />
              <Text variant="bodyMedium" style={styles.name} numberOfLines={1}>
                {name}
              </Text>
            </Pressable>
          );
        })
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { paddingTop: spacing.md, paddingBottom: spacing.xl },
  searchWrap: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  search: { height: 46, fontSize: 15 },
  noMatch: { marginTop: spacing.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: spacing.sm,
  },
  name: { flex: 1, fontWeight: '600' },
});
