import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Button, Card } from '@/components/ui';
import { EmptyState } from '@/components/EmptyState';
import { GroupBucketModal } from '@/components/GroupBucketModal';
import { GroupListSection } from '@/components/GroupListSection';
import { GroupStatsRow } from '@/components/GroupStatsRow';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/contexts/LanguageContext';
import { getUserGroups } from '@/lib/groups';
import { categorizeGroups } from '@/lib/group-sections';
import type { GroupBucket } from '@/lib/group-sections';
import type { AjoGroup } from '@/lib/types';
import { spacing, useThemeTokens } from '@/theme';

export default function GroupsScreen() {
  const { user, canSave } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();
  const [groups, setGroups] = useState<AjoGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [modalBucket, setModalBucket] = useState<GroupBucket | null>(null);
  const { colors } = useThemeTokens();

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

  const { draft, active, completed } = useMemo(() => categorizeGroups(groups), [groups]);
  const hasGroups = groups.length > 0;

  const modalGroups =
    modalBucket === 'draft' ? draft : modalBucket === 'completed' ? completed : [];

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <Screen
      safeArea={false}
      tabBarInset
      refreshing={refreshing}
      onRefresh={async () => {
        setRefreshing(true);
        await load();
        setRefreshing(false);
      }}
      contentStyle={styles.content}>
      {!canSave ? (
        <Card style={styles.controlCard}>
          <Text style={[styles.controlTitle, { color: colors.textPrimary }]}>{t('groups.notInApp')}</Text>
          <Text style={[styles.controlBody, { color: colors.textSecondary }]}>
            {t('groups.notInAppBody')}
          </Text>
          <Button title={t('common.goToProfile')} onPress={() => router.push('/(tabs)/profile')} style={styles.controlBtn} />
        </Card>
      ) : null}

      <View style={styles.actions}>
        <Button title={t('common.create')} onPress={() => router.push('/group/create')} style={styles.actionBtn} />
        <Button title={t('common.join')} onPress={() => router.push('/group/join')} variant="secondary" style={styles.actionBtn} />
      </View>

      {hasGroups ? (
        <GroupStatsRow
          active={active.length}
          draft={draft.length}
          completed={completed.length}
          onPressDraft={() => setModalBucket('draft')}
          onPressHistory={() => setModalBucket('completed')}
        />
      ) : null}

      {loadError ? <Text style={[styles.error, { color: colors.error }]}>{loadError}</Text> : null}

      {!hasGroups ? (
        <EmptyState
          title={t('groups.noGroups')}
          message={t('groups.noGroupsMessage')}
        />
      ) : (
        <View style={styles.sections}>
          <GroupListSection bucket="active" groups={active} />
        </View>
      )}

      {modalBucket ? (
        <GroupBucketModal
          visible
          bucket={modalBucket}
          groups={modalGroups}
          onClose={() => setModalBucket(null)}
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { paddingTop: 8, paddingBottom: spacing.xl },
  actions: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  actionBtn: { flex: 1, marginVertical: 0 },
  controlCard: { marginBottom: spacing.md },
  controlTitle: { fontSize: 15, fontWeight: '700', marginBottom: spacing.xs },
  controlBody: { fontSize: 14, lineHeight: 20, marginBottom: spacing.sm },
  controlBtn: { marginBottom: 0 },
  error: { fontSize: 14, marginBottom: spacing.md, lineHeight: 20 },
  sections: { gap: spacing.xs },
});
