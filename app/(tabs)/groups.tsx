import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { EmptyState } from '@/components/EmptyState';
import { GroupCard } from '@/components/GroupCard';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/contexts/AuthContext';
import Colors, { brand } from '@/constants/Colors';
import { getUserGroups } from '@/lib/groups';
import type { AjoGroup } from '@/lib/types';
import { useColorScheme } from '@/components/useColorScheme';

export default function GroupsScreen() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<AjoGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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

  return (
    <Screen
      refreshing={refreshing}
      onRefresh={async () => {
        setRefreshing(true);
        await load();
        setRefreshing(false);
      }}
      contentStyle={styles.content}>
      {groups.length === 0 ? (
        <EmptyState title="No groups" message="Create or join an Ajo group to get started." />
      ) : (
        groups.map((g) => <GroupCard key={g.id} group={g} />)
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { paddingTop: 8 },
});
