import { Link } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { GroupCard } from '@/components/GroupCard';
import { EmptyState } from '@/components/EmptyState';
import { useColorScheme } from '@/components/useColorScheme';
import { useAuth } from '@/contexts/AuthContext';
import Colors, { brand } from '@/constants/Colors';
import { getUserGroups } from '@/lib/groups';
import type { AjoGroup } from '@/lib/types';

export default function HomeScreen() {
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

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={brand.primary} />
      </View>
    );
  }

  const activeGroups = groups.filter((g) => g.status === 'active');

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={brand.primary} />}>
      <Text style={[styles.greeting, { color: colors.text }]}>Ajo Esusu</Text>
      <Text style={[styles.sub, { color: colors.textSecondary }]}>
        {activeGroups.length} active group{activeGroups.length !== 1 ? 's' : ''}
      </Text>

      <View style={styles.actions}>
        <Link href="/group/create" style={[styles.actionBtn, { backgroundColor: brand.primary }]}>
          <Text style={styles.actionText}>Create Group</Text>
        </Link>
        <Link href="/group/join" style={[styles.actionBtn, { backgroundColor: colors.card, borderColor: brand.primary, borderWidth: 1.5 }]}>
          <Text style={[styles.actionText, { color: brand.primary }]}>Join Group</Text>
        </Link>
      </View>

      <Text style={[styles.section, { color: colors.text }]}>Your Groups</Text>
      {groups.length === 0 ? (
        <EmptyState
          title="No groups yet"
          message="Create a new Ajo group or join one with an invite code."
        />
      ) : (
        groups.map((g) => <GroupCard key={g.id} group={g} />)
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingTop: 60 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  greeting: { fontSize: 28, fontWeight: '800' },
  sub: { fontSize: 15, marginTop: 4, marginBottom: 24 },
  actions: { flexDirection: 'row', gap: 12, marginBottom: 28 },
  actionBtn: { flex: 1, paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  actionText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  section: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
});
