import { StyleSheet, View } from 'react-native';
import { Card, Section } from '@/components/ui';
import { GroupMemberMessageRow, type GroupMessagePerson } from '@/components/group/GroupMemberMessageRow';
import { spacing, useThemeTokens } from '@/theme';

interface Props {
  title: string;
  adminPerson: GroupMessagePerson | null;
  members: GroupMessagePerson[];
  canMessage: boolean;
  onMessage: (userId: string) => void;
}

export function GroupMembersList({ title, adminPerson, members, canMessage, onMessage }: Props) {
  const { colors } = useThemeTokens();
  const people = [...(adminPerson ? [adminPerson] : []), ...members];

  return (
    <Section title={title} style={styles.section}>
      <Card style={styles.card}>
        {people.map((person, index) => (
          <View key={person.userId}>
            <GroupMemberMessageRow
              person={person}
              canMessage={canMessage}
              onMessage={onMessage}
              embedded
            />
            {index < people.length - 1 ? (
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
            ) : null}
          </View>
        ))}
      </Card>
    </Section>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: spacing.sm },
  card: { padding: 0, overflow: 'hidden', marginBottom: spacing.md },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: spacing.md + 40 + spacing.md },
});
