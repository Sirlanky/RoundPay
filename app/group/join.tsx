import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text } from 'react-native';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { useAuth } from '@/contexts/AuthContext';
import { joinGroup } from '@/lib/groups';

export default function JoinGroupScreen() {
  const { user } = useAuth();
  const { code } = useLocalSearchParams<{ code?: string }>();
  const [inviteCode, setInviteCode] = useState(code?.toString().toUpperCase() ?? '');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (code) setInviteCode(code.toString().toUpperCase());
  }, [code]);

  const handleJoin = async () => {
    if (!user) return;
    if (!inviteCode.trim()) {
      Alert.alert('Error', 'Enter invite code');
      return;
    }

    setLoading(true);
    try {
      const group = await joinGroup(inviteCode.trim(), user.id);
      Alert.alert('Joined!', `You joined ${group.name}`, [
        { text: 'OK', onPress: () => router.replace(`/group/${group.id}`) },
      ]);
    } catch (e) {
      Alert.alert('Error', (e as Error).message);
    }
    setLoading(false);
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Input
        label="Invite code"
        value={inviteCode}
        onChangeText={(t) => setInviteCode(t.toUpperCase())}
        placeholder="ABC123"
        autoCapitalize="characters"
      />
      <Text style={styles.hint}>Ask the group admin for the 6-character invite code.</Text>
      <Button title="Join group" onPress={handleJoin} loading={loading} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20 },
  hint: { fontSize: 13, color: '#666', marginBottom: 16, marginTop: -8 },
});
