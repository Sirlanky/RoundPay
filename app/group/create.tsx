import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { useColorScheme } from '@/components/useColorScheme';
import { useAuth } from '@/contexts/AuthContext';
import Colors, { brand } from '@/constants/Colors';
import { createGroup } from '@/lib/groups';
import type { GroupFrequency } from '@/lib/types';

export default function CreateGroupScreen() {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [maxMembers, setMaxMembers] = useState('10');
  const [adminFee, setAdminFee] = useState('0');
  const [frequency, setFrequency] = useState<GroupFrequency>('weekly');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  const handleCreate = async () => {
    if (!user) return;
    const contributionAmount = parseInt(amount.replace(/\D/g, ''), 10);
    if (!name.trim() || !contributionAmount) {
      Alert.alert('Error', 'Enter group name and contribution amount');
      return;
    }

    setLoading(true);
    try {
      const group = await createGroup({
        name: name.trim(),
        contributionAmount,
        frequency,
        maxMembers: parseInt(maxMembers, 10) || 10,
        adminFeePercent: parseFloat(adminFee) || 0,
        adminId: user.id,
      });
      Alert.alert('Group created', `Invite code: ${group.invite_code}`, [
        { text: 'OK', onPress: () => router.replace(`/group/${group.id}`) },
      ]);
    } catch (e) {
      Alert.alert('Error', (e as Error).message);
    }
    setLoading(false);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <Input label="Group name" value={name} onChangeText={setName} placeholder="Family Ajo" />
      <Input
        label="Contribution amount (₦)"
        value={amount}
        onChangeText={setAmount}
        keyboardType="number-pad"
        placeholder="50000"
      />

      <Text style={[styles.label, { color: colors.text }]}>Frequency</Text>
      <View style={styles.row}>
        {(['weekly', 'monthly'] as GroupFrequency[]).map((f) => (
          <Pressable
            key={f}
            style={[
              styles.chip,
              {
                backgroundColor: frequency === f ? brand.primary : colors.card,
                borderColor: brand.primary,
              },
            ]}
            onPress={() => setFrequency(f)}>
            <Text style={{ color: frequency === f ? '#fff' : colors.text, fontWeight: '600' }}>
              {f === 'weekly' ? 'Weekly' : 'Monthly'}
            </Text>
          </Pressable>
        ))}
      </View>

      <Input label="Max members" value={maxMembers} onChangeText={setMaxMembers} keyboardType="number-pad" />
      <Input label="Admin fee (%)" value={adminFee} onChangeText={setAdminFee} keyboardType="decimal-pad" />

      <Button title="Create group" onPress={handleCreate} loading={loading} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20 },
  label: { fontSize: 14, fontWeight: '500', marginBottom: 8 },
  row: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  chip: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center', borderWidth: 1.5 },
});
