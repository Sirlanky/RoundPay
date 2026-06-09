import { StyleSheet, Text, View } from 'react-native';
import { EmptyState } from './EmptyState';
import { useTranslation } from '@/contexts/LanguageContext';
import { membersStillNeeded, rosterIsComplete } from '@/lib/group-validation';
import { spacing, useThemeTokens } from '@/theme';

interface Props {
  memberCount: number;
  maxMembers: number;
  isAdmin: boolean;
  adminParticipates: boolean;
}

export function DraftGroupPanel({ memberCount, maxMembers, isAdmin, adminParticipates }: Props) {
  const { t, tp } = useTranslation();
  const { colors } = useThemeTokens();
  const spotsLeft = membersStillNeeded(memberCount, maxMembers);
  const rosterComplete = rosterIsComplete(memberCount, maxMembers);
  const fillRatio = maxMembers > 0 ? memberCount / maxMembers : 0;

  const spotsLabel =
    spotsLeft > 0
      ? tp(spotsLeft, 'plural.spotLeft_one', 'plural.spotLeft_other', { count: spotsLeft })
      : t('group.draftRosterFull');

  const bodyText = isAdmin
    ? adminParticipates
      ? tp(maxMembers, 'group.draftStartWhenFull_one', 'group.draftStartWhenFull_other', { count: maxMembers })
      : tp(maxMembers, 'group.draftOrganizerWhenFull_one', 'group.draftOrganizerWhenFull_other', {
          count: maxMembers,
        })
    : tp(maxMembers, 'group.draftWaitingAdmin_one', 'group.draftWaitingAdmin_other', { count: maxMembers });

  return (
    <View style={styles.wrap}>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>{t('group.draftTitle')}</Text>
        <Text style={[styles.body, { color: colors.textSecondary }]}>{bodyText}</Text>

        <View style={[styles.track, { backgroundColor: colors.background }]}>
          <View style={[styles.fill, { width: `${Math.min(100, fillRatio * 100)}%`, backgroundColor: colors.primary }]} />
        </View>
        <Text style={[styles.stats, { color: colors.textSecondary }]}>
          {tp(memberCount, 'plural.roster_one', 'plural.roster_other', { current: memberCount, max: maxMembers })}
          {spotsLeft > 0 ? ` · ${spotsLabel}` : ` · ${t('group.draftRosterFull')}`}
        </Text>
      </View>

      {!rosterComplete ? (
        <EmptyState
          title={tp(spotsLeft, 'group.draftWaitingTitle_one', 'group.draftWaitingTitle_other')}
          message={
            isAdmin
              ? tp(spotsLeft, 'group.draftNeedMore_one', 'group.draftNeedMore_other', {
                  count: spotsLeft,
                  max: maxMembers,
                })
              : t('group.draftJoinedLine_other', { current: memberCount, max: maxMembers })
          }
        />
      ) : isAdmin ? (
        <Text style={[styles.ready, { color: colors.primary }]}>{t('group.draftReadyAdmin')}</Text>
      ) : (
        <Text style={[styles.ready, { color: colors.textSecondary }]}>
          {tp(maxMembers, 'group.draftReadyMember_one', 'group.draftReadyMember_other', { count: maxMembers })}
        </Text>
      )}

      {!rosterComplete && isAdmin ? (
        <Text style={[styles.hint, { color: colors.textSecondary }]}>
          {tp(maxMembers, 'group.draftUnlockHint_one', 'group.draftUnlockHint_other', { max: maxMembers })}
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
