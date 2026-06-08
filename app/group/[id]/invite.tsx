import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Card } from '@/components/ui';
import { DraftGroupPanel } from '@/components/DraftGroupPanel';
import { InviteCodeCard } from '@/components/InviteCodeCard';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/contexts/AuthContext';
import { useGroup } from '@/hooks/useGroup';
import { spacing, useThemeTokens } from '@/theme';

export default function InviteMembersScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { group, members, loading, error } = useGroup(id);
  const { colors } = useThemeTokens();

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (error || !group) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.error }}>{error ?? 'Group not found'}</Text>
      </View>
    );
  }

  const isDraft = group.status === 'draft';
  const isAdmin = group.admin_id === user?.id;

  return (
    <Screen safeArea={false} contentStyle={styles.content}>
      <Text style={[styles.title, { color: colors.textPrimary }]}>{group.name}</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        {isDraft
          ? 'Share the invite code so friends can join before you start the group.'
          : 'This group has already started — new members cannot join with an invite code.'}
      </Text>

      {isDraft ? (
        <>
          <Card>
            <InviteCodeCard groupName={group.name} inviteCode={group.invite_code} />
          </Card>
          <DraftGroupPanel
            memberCount={members.length}
            maxMembers={group.max_members}
            isAdmin={!!isAdmin}
            adminParticipates={members.some((m) => m.user_id === user?.id)}
          />
        </>
      ) : (
        <Card>
          <Text style={[styles.closedBody, { color: colors.textSecondary }]}>
            Invite codes only work while a group is still being set up. Open group details to see
            members and payment status.
          </Text>
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  content: { paddingTop: spacing.sm },
  title: { fontSize: 22, fontWeight: '700', marginBottom: spacing.xs },
  subtitle: { fontSize: 14, lineHeight: 20, marginBottom: spacing.lg },
  closedBody: { fontSize: 14, lineHeight: 20 },
});
