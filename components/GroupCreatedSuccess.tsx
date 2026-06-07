import { Share, StyleSheet } from 'react-native';
import { Button, Card, Text } from '@/components/ui';
import { formatNaira, frequencyLabel } from '@/lib/format';
import type { AjoGroup } from '@/lib/types';
import { spacing } from '@/theme';

interface Props {
  group: AjoGroup;
  onOpenGroup: () => void;
  onCreateAnother: () => void;
}

export function GroupCreatedSuccess({ group, onOpenGroup, onCreateAnother }: Props) {
  const shareInvite = async () => {
    const link = `roundpay://join/${group.invite_code}`;
    await Share.share({
      message: `Join "${group.name}" on RoundPay!\n\nInvite code: ${group.invite_code}\n${link}`,
    });
  };

  return (
    <>
      <Card variant="standard">
        <Text variant="bodySmall" color="success" style={styles.title}>
          Group created
        </Text>
        <Text variant="headingLarge">{group.name}</Text>
        <Text variant="headingLarge" color="accent" style={styles.amount}>
          {formatNaira(group.contribution_amount)}
        </Text>
        <Text variant="bodySmall" color="secondary" style={styles.meta}>
          {frequencyLabel(group.frequency)} · draft
        </Text>
        <Text variant="caption" color="secondary" style={styles.codeLabel}>
          Invite code
        </Text>
        <Text variant="display" style={styles.code}>
          {group.invite_code}
        </Text>
        <Text variant="caption" color="secondary" style={styles.hint}>
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
  title: { fontWeight: '600', marginBottom: spacing.sm },
  amount: { marginTop: spacing.xs },
  meta: { marginTop: 4 },
  codeLabel: { marginTop: spacing.lg },
  code: { letterSpacing: 4, marginTop: 4, fontSize: 28, lineHeight: 34 },
  hint: { marginTop: spacing.md, lineHeight: 18 },
});
