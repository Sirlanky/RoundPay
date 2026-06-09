import { Screen } from '@/components/Screen';
import { ConversationsList } from '@/components/messages/ConversationsList';
import { spacing } from '@/theme';

export default function ConversationsScreen() {
  return (
    <Screen contentStyle={{ paddingTop: spacing.md, paddingBottom: spacing.xl }}>
      <ConversationsList />
    </Screen>
  );
}
