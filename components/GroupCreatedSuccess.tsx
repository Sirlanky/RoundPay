import { Share, StyleSheet, Text } from 'react-native';
import { Button } from './Button';
import { Card } from './Card';
import Colors, { brand } from '@/constants/Colors';
import { formatNaira, frequencyLabel } from '@/lib/format';
import type { AjoGroup } from '@/lib/types';
import { spacing } from '@/constants/theme';
import { useColorScheme } from './useColorScheme';

interface Props {
  group: AjoGroup;
  onOpenGroup: () => void;
  onCreateAnother: () => void;
}

export function GroupCreatedSuccess({ group, onOpenGroup, onCreateAnother }: Props) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  const shareInvite = async () => {
    const link = `ajoesusu://join/${group.invite_code}`;
    await Share.share({
      message: `Join "${group.name}" on Ajo Esusu!\n\nInvite code: ${group.invite_code}\n${link}`,
    });
  };

  return (
    <>
      <Card>
        <Text style={[styles.title, { color: colors.text }]}>Group created</Text>
        <Text style={[styles.name, { color: colors.text }]}>{group.name}</Text>
        <Text style={[styles.amount, { color: brand.primary }]}>{formatNaira(group.contribution_amount)}</Text>
        <Text style={[styles.meta, { color: colors.textSecondary }]}>{frequencyLabel(group.frequency)} · draft</Text>
        <Text style={[styles.codeLabel, { color: colors.textSecondary }]}>Invite code</Text>
        <Text style={[styles.code, { color: colors.text }]}>{group.invite_code}</Text>
        <Text style={[styles.hint, { color: colors.textSecondary }]}>
          Share this code so others can join before you start the first cycle.
        </Text>
      </Card>
      <Button title="Share invite" onPress={shareInvite} />
      <Button title="Open group" onPress={onOpenGroup} />
      <Button title="Create another" onPress={onCreateAnother} variant="secondary" />
    </>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 14, fontWeight: '600', color: '#0D7A4A', marginBottom: spacing.sm },
  name: { fontSize: 22, fontWeight: '800' },
  amount: { fontSize: 24, fontWeight: '800', marginTop: spacing.xs },
  meta: { fontSize: 14, marginTop: 4 },
  codeLabel: { fontSize: 12, marginTop: spacing.lg },
  code: { fontSize: 28, fontWeight: '800', letterSpacing: 4, marginTop: 4 },
  hint: { fontSize: 13, lineHeight: 18, marginTop: spacing.md },
});
