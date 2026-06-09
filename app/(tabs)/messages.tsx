import { useFocusEffect, useNavigation } from 'expo-router';
import { useCallback, useLayoutEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { ConversationsList } from '@/components/messages/ConversationsList';
import { MessagesComposeButton } from '@/components/messages/MessagesComposeButton';
import { Screen } from '@/components/Screen';
import { useMessagesContext } from '@/contexts/MessagesContext';
import { spacing } from '@/theme';

export default function MessagesTabScreen() {
  const navigation = useNavigation();
  const { refetch } = useMessagesContext();
  const [refreshing, setRefreshing] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => <MessagesComposeButton />,
    });
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  return (
    <Screen
      safeArea={false}
      tabBarInset
      refreshing={refreshing}
      onRefresh={onRefresh}
      contentStyle={styles.content}>
      <ConversationsList />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: spacing.sm, paddingBottom: spacing.xl },
});
