import { Link, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { useColorScheme } from '@/components/useColorScheme';
import { useAuth } from '@/contexts/AuthContext';
import Colors, { brand } from '@/constants/Colors';
import { supabase } from '@/lib/supabase';

export default function ProfileScreen() {
  const { profile, user, refreshProfile, signOut } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');

  useEffect(() => {
    setFullName(profile?.full_name ?? '');
    setPhone(profile?.phone ?? '');
  }, [profile?.full_name, profile?.phone]);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    await supabase
      .from('profiles')
      .update({ full_name: fullName, phone })
      .eq('id', user.id);
    await refreshProfile();
    setSaving(false);
    Alert.alert('Saved', 'Profile updated.');
  };

  const handleSignOut = async () => {
    await signOut();
    router.replace('/(auth)/login');
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <Text style={[styles.title, { color: colors.text }]}>Profile</Text>

      <Input label="Full name" value={fullName} onChangeText={setFullName} placeholder="Your name" />
      <Input label="Phone" value={phone} onChangeText={setPhone} placeholder="+234..." keyboardType="phone-pad" />
      <Text style={[styles.email, { color: colors.textSecondary }]}>{user?.email ?? profile?.email}</Text>

      <Button title="Save profile" onPress={saveProfile} loading={saving} />

      <View style={[styles.bankCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.bankTitle, { color: colors.text }]}>Bank account (for payouts)</Text>
        {profile?.account_number ? (
          <Text style={{ color: colors.textSecondary }}>
            {profile.bank_name} · {profile.account_number}{'\n'}
            {profile.account_name}
          </Text>
        ) : (
          <Text style={{ color: colors.textSecondary }}>No bank account added</Text>
        )}
        <Link href="/profile/bank" style={{ color: brand.primary, marginTop: 12, fontWeight: '600' }}>
          {profile?.account_number ? 'Update bank account' : 'Add bank account'}
        </Link>
      </View>

      <Button title="Sign out" onPress={handleSignOut} variant="secondary" style={{ marginTop: 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingTop: 60 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 24 },
  email: { fontSize: 14, marginBottom: 16, marginTop: -8 },
  bankCard: { borderRadius: 12, padding: 16, borderWidth: 1, marginTop: 16 },
  bankTitle: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
});
