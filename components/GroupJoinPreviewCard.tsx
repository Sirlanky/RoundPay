import { ActivityIndicator, StyleSheet, Text } from 'react-native';
import { Card } from '@/components/ui';
import { StatusBadge } from './StatusBadge';
import { useTranslation } from '@/contexts/LanguageContext';
import { formatNaira, frequencyLabel } from '@/lib/format';
import type { GroupJoinPreview } from '@/lib/groups';
import { spacing, useThemeTokens } from '@/theme';

interface Props {
  preview: GroupJoinPreview | null;
  loading: boolean;
  code: string;
}

export function GroupJoinPreviewCard({ preview, loading, code }: Props) {
  const { t, tp } = useTranslation();
  const { colors } = useThemeTokens();

  if (code.length < 6) return null;

  if (loading) {
    return (
      <Card>
        <ActivityIndicator color={colors.primary} />
      </Card>
    );
  }

  if (!preview) {
    return (
      <Card>
        <Text style={[styles.notFound, { color: colors.error }]}>
          No open group found for code {code}. Check the code or ask if the Ajo already started.
        </Text>
      </Card>
    );
  }

  const spotsLeft = preview.max_members - preview.member_count;
  const spotsLabel =
    spotsLeft > 0
      ? tp(spotsLeft, 'plural.spotLeft_one', 'plural.spotLeft_other', { count: spotsLeft })
      : t('group.previewFull');

  return (
    <Card>
      <Text style={[styles.label, { color: colors.textSecondary }]}>You are joining</Text>
      <Text style={[styles.name, { color: colors.textPrimary }]}>{preview.name}</Text>
      <Text style={[styles.amount, { color: colors.primary }]}>{formatNaira(preview.contribution_amount)}</Text>
      <Text style={[styles.meta, { color: colors.textSecondary }]}>
        {frequencyLabel(preview.frequency)} ·{' '}
        {tp(preview.max_members, 'group.previewMembers_one', 'group.previewMembers_other', {
          current: preview.member_count,
          max: preview.max_members,
          spots: spotsLabel,
        })}
      </Text>
      <StatusBadge status={preview.status} />
    </Card>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 12, marginBottom: 4 },
  name: { fontSize: 20, fontWeight: '700' },
  amount: { fontSize: 22, fontWeight: '800', marginTop: spacing.xs },
  meta: { fontSize: 14, marginTop: spacing.xs, marginBottom: spacing.sm },
  notFound: { fontSize: 14, lineHeight: 20 },
});
