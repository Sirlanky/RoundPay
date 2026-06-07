import { StyleSheet, Text, View } from 'react-native';
import { EmptyState } from './EmptyState';
import { useColorScheme } from './useColorScheme';
import Colors, { brand } from '@/constants/Colors';
import { membersStillNeeded, rosterIsComplete } from '@/lib/group-validation';
import { spacing } from '@/constants/theme';

interface Props {
  memberCount: number;
  maxMembers: number;
  isAdmin: boolean;
  adminParticipates: boolean;
}

export function DraftGroupPanel({ memberCount, maxMembers, isAdmin, adminParticipates }: Props) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const spotsLeft = membersStillNeeded(memberCount, maxMembers);
  const rosterComplete = rosterIsComplete(memberCount, maxMembers);
  const fillRatio = maxMembers > 0 ? memberCount / maxMembers : 0;

  return (
    <View style={styles.wrap}>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Setting up your Ajo</Text>
        <Text style={[styles.body, { color: colors.textSecondary }]}>
          {isAdmin
            ? adminParticipates
              ? `Share the invite code so others can join. Cycle 1 starts when all ${maxMembers} members are in.`
              : `You are organizing only. Share the invite code — cycle 1 starts when all ${maxMembers} members join.`
            : `The admin will start the first cycle once all ${maxMembers} members have joined.`}
        </Text>

        <View style={[styles.track, { backgroundColor: colors.background }]}>
          <View style={[styles.fill, { width: `${Math.min(100, fillRatio * 100)}%`, backgroundColor: brand.primary }]} />
        </View>
        <Text style={[styles.stats, { color: colors.textSecondary }]}>
          {memberCount}/{maxMembers} members
          {spotsLeft > 0 ? ` · ${spotsLeft} spot${spotsLeft === 1 ? '' : 's'} left` : ' · Roster full'}
        </Text>
      </View>

      {!rosterComplete ? (
        <EmptyState
          title="Waiting for members"
          message={
            isAdmin
              ? `Need ${spotsLeft} more member${spotsLeft === 1 ? '' : 's'} to fill the roster (${maxMembers} total).`
              : `${memberCount}/${maxMembers} joined. The admin can start when everyone is in.`
          }
        />
      ) : isAdmin ? (
        <Text style={[styles.ready, { color: brand.primary }]}>
          Roster full — ready to start cycle 1.
        </Text>
      ) : (
        <Text style={[styles.ready, { color: colors.textSecondary }]}>
          All {maxMembers} members joined. Waiting for admin to start.
        </Text>
      )}

      {!rosterComplete && isAdmin ? (
        <Text style={[styles.hint, { color: colors.textSecondary }]}>
          Start group unlocks when {maxMembers}/{maxMembers} members are in the list below.
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.md },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  title: { fontSize: 16, fontWeight: '700', marginBottom: spacing.xs },
  body: { fontSize: 14, lineHeight: 20, marginBottom: spacing.md },
  track: { height: 8, borderRadius: 4, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4 },
  stats: { fontSize: 13, marginTop: spacing.sm },
  ready: { fontSize: 14, fontWeight: '600', textAlign: 'center', marginBottom: spacing.sm },
  hint: { fontSize: 12, textAlign: 'center', lineHeight: 17 },
});
