import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { GroupCard } from '@/components/GroupCard';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/contexts/AuthContext';
import Colors, { brand } from '@/constants/Colors';
import { getUserGroups } from '@/lib/groups';
import type { AjoGroup } from '@/lib/types';
import { spacing } from '@/constants/theme';
import { useColorScheme } from '@/components/useColorScheme';

export default function GroupsScreen() {
  const { user, canSave } = useAuth();
  const router = useRouter();
  const [groups, setGroups] = useState<AjoGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  const load = useCallback(async () => {
    if (!user) {
      setGroups([]);
      setLoadError('');
      setLoading(false);
      return;
    }
    try {
      setLoadError('');
      const data = await getUserGroups(user.id);
      setGroups(data as AjoGroup[]);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Could not load groups');
      setGroups([]);
    } finally {
      setLoading(false);
    }
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
      safeArea={false}
      refreshing={refreshing}
      onRefresh={async () => {
        setRefreshing(true);
        await load();
        setRefreshing(false);
      }}
      contentStyle={styles.content}>
      {!canSave ? (
        <Card style={styles.controlCard}>
          <Text style={[styles.controlTitle, { color: colors.text }]}>You’re not in the app yet</Text>
          <Text style={[styles.controlBody, { color: colors.textSecondary }]}>
            Open Profile and tap Enter app to create and manage groups.
          </Text>
          <Button title="Go to Profile" onPress={() => router.push('/(tabs)/profile')} style={styles.controlBtn} />
        </Card>
      ) : null}

      <View style={styles.actions}>
        <Button title="Create" onPress={() => router.push('/group/create')} style={styles.actionBtn} />
        <Button
          title="Join"
          onPress={() => router.push('/group/join')}
          variant="secondary"
          style={styles.actionBtn}
        />
      </View>

      {loadError ? <Text style={[styles.error, { color: colors.error }]}>{loadError}</Text> : null}

      {groups.length === 0 ? (
        <EmptyState
          title="No groups yet"
          message="Create an Ajo for your circle or join with an invite code from a friend."
        />
      ) : (
        groups.map((g) => <GroupCard key={g.id} group={g} />)
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { paddingTop: 8 },
  actions: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  actionBtn: { flex: 1, marginVertical: 0 },
  controlCard: { marginBottom: spacing.md },
  controlTitle: { fontSize: 15, fontWeight: '700', marginBottom: spacing.xs },
  controlBody: { fontSize: 14, lineHeight: 20, marginBottom: spacing.sm },
  controlBtn: { marginBottom: 0 },
  error: { fontSize: 14, marginBottom: spacing.md, lineHeight: 20 },
});
