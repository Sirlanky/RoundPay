import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/contexts/AuthContext';
import { joinGroup } from '@/lib/groups';
import { spacing } from '@/constants/theme';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';

export default function JoinGroupScreen() {
  const { user } = useAuth();
  const { code } = useLocalSearchParams<{ code?: string }>();
  const [inviteCode, setInviteCode] = useState(code?.toString().toUpperCase() ?? '');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  useEffect(() => {
    if (code) setInviteCode(code.toString().toUpperCase());
  }, [code]);

  const handleJoin = async () => {
    if (!user) return;
    if (!inviteCode.trim()) {
      Alert.alert('Missing code', 'Enter the 6-character invite code.');
      return;
    }

    setLoading(true);
    try {
      const group = await joinGroup(inviteCode.trim(), user.id);
      Alert.alert('Joined', `You joined ${group.name}`, [
        { text: 'OK', onPress: () => router.replace(`/group/${group.id}`) },
      ]);
    } catch (e) {
      Alert.alert('Error', (e as Error).message);
    }
    setLoading(false);
  };

  return (
    <Screen keyboard contentStyle={styles.content}>
      <Text style={[styles.hint, { color: colors.textSecondary }]}>
        Ask your group admin for the invite code. Groups must still be in draft (not started).
      </Text>
      <Input
        label="Invite code"
        value={inviteCode}
        onChangeText={(t) => setInviteCode(t.toUpperCase())}
        placeholder="ABC123"
        autoCapitalize="characters"
        maxLength={6}
      />
      <Button title="Join group" onPress={handleJoin} loading={loading} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: spacing.md },
  hint: { fontSize: 14, lineHeight: 20, marginBottom: spacing.lg },
});
