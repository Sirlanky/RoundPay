import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { AuthActionBanner } from '@/components/AuthActionBanner';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { GroupCreatedSuccess } from '@/components/GroupCreatedSuccess';
import { Input } from '@/components/Input';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/contexts/AuthContext';
import Colors, { brand } from '@/constants/Colors';
import { messageFromGroupError } from '@/lib/group-errors';
import { poolSummary, validateCreateGroupInput } from '@/lib/group-validation';
import { createGroup } from '@/lib/groups';
import type { AjoGroup, GroupFrequency } from '@/lib/types';
import { spacing } from '@/constants/theme';
import { useColorScheme } from '@/components/useColorScheme';

export default function CreateGroupScreen() {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [maxMembers, setMaxMembers] = useState('10');
  const [adminFee, setAdminFee] = useState('0');
  const [frequency, setFrequency] = useState<GroupFrequency>('weekly');
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState<AjoGroup | null>(null);
  const router = useRouter();
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  const summary = useMemo(() => {
    const v = validateCreateGroupInput({
      name,
      amountRaw: amount,
      maxMembersRaw: maxMembers,
      adminFeeRaw: adminFee,
    });
    if (!v.ok) return null;
    return poolSummary(v.data.contributionAmount, v.data.maxMembers, frequency, v.data.adminFeePercent);
  }, [name, amount, maxMembers, adminFee, frequency]);

  const handleCreate = async () => {
    if (!user) {
      Alert.alert('Sign in required', 'Leave build mode and sign in to create a group.');
      return;
    }

    const v = validateCreateGroupInput({
      name,
      amountRaw: amount,
      maxMembersRaw: maxMembers,
      adminFeeRaw: adminFee,
    });
    if (!v.ok) {
      Alert.alert('Check your details', v.message);
      return;
    }

    setLoading(true);
    try {
      const group = await createGroup({
        name: v.data.name,
        contributionAmount: v.data.contributionAmount,
        frequency,
        maxMembers: v.data.maxMembers,
        adminFeePercent: v.data.adminFeePercent,
        adminId: user.id,
      });
      setCreated(group as AjoGroup);
    } catch (e) {
      Alert.alert('Could not create group', messageFromGroupError(e));
    }
    setLoading(false);
  };

  if (created) {
    return (
      <Screen safeArea={false} contentStyle={styles.content}>
        <GroupCreatedSuccess
          group={created}
          onOpenGroup={() => router.replace(`/group/${created.id}`)}
          onCreateAnother={() => {
            setCreated(null);
            setName('');
            setAmount('');
          }}
        />
      </Screen>
    );
  }

  return (
    <Screen keyboard safeArea={false} contentStyle={styles.content}>
      <Text style={[styles.lead, { color: colors.textSecondary }]}>
        Set the rules for your Ajo. Members join with an invite code before you start cycle 1.
      </Text>

      <AuthActionBanner action="create a group" />

      <Card>
        <Text style={[styles.section, { color: colors.text }]}>Basics</Text>
        <Input label="Group name" value={name} onChangeText={setName} placeholder="e.g. Office Ajo" />
        <Input
          label="Contribution per member (₦)"
          value={amount}
          onChangeText={setAmount}
          keyboardType="number-pad"
          placeholder="50000"
        />

        <Text style={[styles.label, { color: colors.text }]}>How often?</Text>
        <View style={styles.row}>
          {(['weekly', 'monthly'] as GroupFrequency[]).map((f) => (
            <Pressable
              key={f}
              style={[
                styles.chip,
                {
                  backgroundColor: frequency === f ? brand.primary : colors.background,
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
      </Card>

      <Card>
        <Text style={[styles.section, { color: colors.text }]}>Size & fees</Text>
        <Input label="Max members" value={maxMembers} onChangeText={setMaxMembers} keyboardType="number-pad" />
        <Input
          label="Admin fee (%)"
          value={adminFee}
          onChangeText={setAdminFee}
          keyboardType="decimal-pad"
          placeholder="0"
        />
        <Text style={[styles.feeHint, { color: colors.textSecondary }]}>
          Optional fee taken from the pool when a member collects. Use 0 for no fee.
        </Text>
      </Card>

      {summary ? (
        <Card>
          <Text style={[styles.section, { color: colors.text }]}>Summary</Text>
          <Text style={[styles.summary, { color: colors.text }]}>{summary}</Text>
        </Card>
      ) : null}

      <Button
        title="Create group"
        onPress={handleCreate}
        loading={loading}
        disabled={!user || !summary}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: spacing.sm },
  lead: { fontSize: 15, lineHeight: 22, marginBottom: spacing.md },
  section: { fontSize: 16, fontWeight: '700', marginBottom: spacing.md },
  label: { fontSize: 14, fontWeight: '500', marginBottom: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  chip: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center', borderWidth: 1.5 },
  feeHint: { fontSize: 12, lineHeight: 17, marginTop: -spacing.xs },
  summary: { fontSize: 15, lineHeight: 22 },
});
