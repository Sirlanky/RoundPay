import { StyleSheet, Text, View } from 'react-native';
import { EmptyState } from './EmptyState';
import { useColorScheme } from './useColorScheme';
import Colors, { brand } from '@/constants/Colors';
import { spacing } from '@/constants/theme';

const MIN_MEMBERS_TO_START = 2;

interface Props {
  memberCount: number;
  maxMembers: number;
  isAdmin: boolean;
}

export function DraftGroupPanel({ memberCount, maxMembers, isAdmin }: Props) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const spotsLeft = Math.max(0, maxMembers - memberCount);
  const needMore = Math.max(0, MIN_MEMBERS_TO_START - memberCount);
  const canStart = memberCount >= MIN_MEMBERS_TO_START;
  const fillRatio = maxMembers > 0 ? memberCount / maxMembers : 0;

  return (
    <View style={styles.wrap}>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Setting up your Ajo</Text>
        <Text style={[styles.body, { color: colors.textSecondary }]}>
          {isAdmin
            ? 'Share the invite code so others can join. When at least 2 members are in, you can start cycle 1.'
            : 'The admin will start the first cycle once enough members have joined.'}
        </Text>

        <View style={[styles.track, { backgroundColor: colors.background }]}>
          <View style={[styles.fill, { width: `${Math.min(100, fillRatio * 100)}%`, backgroundColor: brand.primary }]} />
        </View>
        <Text style={[styles.stats, { color: colors.textSecondary }]}>
          {memberCount}/{maxMembers} members
          {spotsLeft > 0 ? ` · ${spotsLeft} spot${spotsLeft === 1 ? '' : 's'} left` : ' · Full'}
        </Text>
      </View>

      {memberCount < MIN_MEMBERS_TO_START ? (
        <EmptyState
          title="Waiting for members"
          message={
            isAdmin
              ? `Need ${needMore} more member${needMore === 1 ? '' : 's'} before you can start (minimum ${MIN_MEMBERS_TO_START}).`
              : `At least ${MIN_MEMBERS_TO_START} members must join before the admin can start.`
          }
        />
      ) : isAdmin ? (
        <Text style={[styles.ready, { color: brand.primary }]}>
          Ready to start — {memberCount} members joined.
        </Text>
      ) : (
        <Text style={[styles.ready, { color: colors.textSecondary }]}>
          {memberCount} members joined. Waiting for admin to start.
        </Text>
      )}

      {!canStart && isAdmin ? (
        <Text style={[styles.hint, { color: colors.textSecondary }]}>
          Start group unlocks when {MIN_MEMBERS_TO_START}+ members are in the list below.
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
