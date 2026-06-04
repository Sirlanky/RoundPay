import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { GroupCard } from '@/components/GroupCard';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/contexts/AuthContext';
import Colors, { brand } from '@/constants/Colors';
import { getUserGroups } from '@/lib/groups';
import type { AjoGroup } from '@/lib/types';
import { spacing } from '@/constants/theme';
import { useColorScheme } from '@/components/useColorScheme';

export default function HomeScreen() {
  const { user, profile } = useAuth();
  const [groups, setGroups] = useState<AjoGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  const load = useCallback(async () => {
    if (!user) {
      setGroups([]);
      setLoading(false);
      return;
    }
    const data = await getUserGroups(user.id);
    setGroups(data as AjoGroup[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={brand.primary} size="large" />
      </View>
    );
  }

  const activeGroups = groups.filter((g) => g.status === 'active');
  const firstName = profile?.full_name?.split(' ')[0] ?? 'there';

  return (
    <Screen
      refreshing={refreshing}
      onRefresh={async () => {
        setRefreshing(true);
        await load();
        setRefreshing(false);
      }}
      contentStyle={styles.content}>
      <Text style={[styles.greeting, { color: colors.textSecondary }]}>Welcome back</Text>
      <Text style={[styles.name, { color: colors.text }]}>{firstName}</Text>
      <Text style={[styles.stats, { color: colors.textSecondary }]}>
        {activeGroups.length} active · {groups.length} total groups
      </Text>

      <View style={styles.actions}>
        <Button title="Create group" onPress={() => router.push('/group/create')} style={styles.actionBtn} />
        <Button title="Join group" onPress={() => router.push('/group/join')} variant="secondary" style={styles.actionBtn} />
      </View>

      <Text style={[styles.section, { color: colors.text }]}>Your groups</Text>
      {groups.length === 0 ? (
        <EmptyState
          title="No groups yet"
          message="Start an Ajo with friends or join one using an invite code."
        />
      ) : (
        groups.map((g) => <GroupCard key={g.id} group={g} />)
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { paddingTop: spacing.sm },
  greeting: { fontSize: 15 },
  name: { fontSize: 28, fontWeight: '800', marginTop: 2 },
  stats: { fontSize: 14, marginTop: spacing.xs, marginBottom: spacing.lg },
  actions: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  actionBtn: { flex: 1, marginVertical: 0 },
  section: { fontSize: 18, fontWeight: '600', marginBottom: spacing.md },
});
