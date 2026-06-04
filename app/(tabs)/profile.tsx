import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';
import { BuildModeBanner } from '@/components/BuildModeBanner';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Input } from '@/components/Input';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/contexts/AuthContext';
import Colors, { brand } from '@/constants/Colors';
import { supabase } from '@/lib/supabase';
import { spacing } from '@/constants/theme';
import { useColorScheme } from '@/components/useColorScheme';

export default function ProfileScreen() {
  const { profile, user, buildMode, refreshProfile, signOut } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  useEffect(() => {
    setFullName(profile?.full_name ?? '');
    setPhone(profile?.phone ?? '');
  }, [profile?.full_name, profile?.phone]);

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    await supabase.from('profiles').update({ full_name: fullName, phone }).eq('id', user.id);
    await refreshProfile();
    setSaving(false);
    Alert.alert('Saved', 'Profile updated.');
  };

  const handleSignOut = async () => {
    await signOut();
    router.replace('/(auth)/login');
  };

  return (
    <Screen contentStyle={styles.content} safeArea={false}>
      <BuildModeBanner />
      <Text style={[styles.email, { color: colors.textSecondary }]}>
        {user?.email ?? profile?.email ?? (buildMode ? 'Not signed in' : '')}
      </Text>

      <Card>
        <Input label="Full name" value={fullName} onChangeText={setFullName} placeholder="Your name" />
        <Input label="Phone" value={phone} onChangeText={setPhone} placeholder="+234 800 000 0000" keyboardType="phone-pad" />
        <Button title="Save profile" onPress={saveProfile} loading={saving} />
      </Card>

      <Card>
        <Text style={[styles.bankTitle, { color: colors.text }]}>Bank account</Text>
        <Text style={[styles.bankHint, { color: colors.textSecondary }]}>Required to receive cycle payouts</Text>
        {profile?.account_number ? (
          <Text style={[styles.bankDetail, { color: colors.text }]}>
            {profile.bank_name}{'\n'}
            {profile.account_number}{'\n'}
            {profile.account_name}
          </Text>
        ) : (
          <Text style={{ color: colors.textSecondary, marginTop: spacing.sm }}>Not added yet</Text>
        )}
        <Button
          title={profile?.account_number ? 'Update bank account' : 'Add bank account'}
          onPress={() => {
            if (buildMode && !user) {
              Alert.alert(
                'Sign in required',
                'Bank accounts are saved to your profile after you sign in. Leave build mode and sign in first.'
              );
              return;
            }
            router.push('/profile/bank');
          }}
          variant="secondary"
          style={{ marginTop: spacing.md }}
        />
      </Card>

      <Button title="Sign out" onPress={handleSignOut} variant="secondary" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 8 },
  email: { fontSize: 14, marginBottom: spacing.md },
  bankTitle: { fontSize: 16, fontWeight: '600' },
  bankHint: { fontSize: 13, marginTop: 4 },
  bankDetail: { fontSize: 14, marginTop: spacing.md, lineHeight: 22 },
});
