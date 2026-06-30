import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from '@/contexts/LanguageContext';
import { membersStillNeeded, rosterIsComplete } from '@/lib/group-validation';
import { spacing, useThemeTokens } from '@/theme';

interface Props {
  memberCount: number;
  maxMembers: number;
  isAdmin: boolean;
}

export function DraftGroupPanel({ memberCount, maxMembers, isAdmin }: Props) {
  const { t } = useTranslation();
  const { colors } = useThemeTokens();
  const spotsLeft = membersStillNeeded(memberCount, maxMembers);
  const rosterComplete = rosterIsComplete(memberCount, maxMembers);
  const fillRatio = maxMembers > 0 ? memberCount / maxMembers : 0;

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.topRow}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>{t('group.draftTitle')}</Text>
        <Text style={[styles.count, { color: colors.textPrimary }]}>
          {memberCount}/{maxMembers}
        </Text>
      </View>
      <View style={[styles.track, { backgroundColor: colors.background }]}>
        <View
          style={[styles.fill, { width: `${Math.min(100, fillRatio * 100)}%`, backgroundColor: colors.primary }]}
        />
      </View>
      {rosterComplete ? (
        <Text style={[styles.ready, { color: colors.primary }]}>
          {isAdmin ? t('group.draftReadyAdmin') : t('group.draftReadyMember_other', { count: maxMembers })}
        </Text>
      ) : spotsLeft > 0 ? (
        <Text style={[styles.spots, { color: colors.textSecondary }]}>
          {t('group.draftSpotsLeft', { count: spotsLeft })}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  label: { fontSize: 13, fontWeight: '600' },
  count: { fontSize: 15, fontWeight: '800' },
  track: { height: 6, borderRadius: 3, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3 },
  ready: { fontSize: 13, fontWeight: '600', marginTop: spacing.sm },
  spots: { fontSize: 13, marginTop: spacing.sm },
});
