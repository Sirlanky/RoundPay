import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, FlatList, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { useColorScheme } from '@/components/useColorScheme';
import { useAuth } from '@/contexts/AuthContext';
import Colors, { brand } from '@/constants/Colors';
import { NIGERIAN_BANKS } from '@/constants/banks';
import { getFunctionsUrl, supabase } from '@/lib/supabase';
import { resolveBankAccount } from '@/lib/paystack';

export default function BankScreen() {
  const { refreshProfile } = useAuth();
  const [accountNumber, setAccountNumber] = useState('');
  const [bankCode, setBankCode] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountName, setAccountName] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const router = useRouter();
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  const handleResolve = async () => {
    if (!accountNumber || !bankCode) {
      Alert.alert('Error', 'Select a bank and enter account number');
      return;
    }
    setLoading(true);
    try {
      const result = await resolveBankAccount(accountNumber, bankCode);
      setAccountName(result.account_name);
    } catch (e) {
      Alert.alert('Error', (e as Error).message);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!accountName) {
      Alert.alert('Error', 'Resolve your account first');
      return;
    }
    setSaving(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;
      if (!token) throw new Error('Not authenticated');

      const res = await fetch(getFunctionsUrl('save-bank-account'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          account_number: accountNumber,
          bank_code: bankCode,
          bank_name: bankName,
          account_name: accountName,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Failed to save');

      await refreshProfile();
      Alert.alert('Saved', 'Bank account linked for payouts.');
      router.back();
    } catch (e) {
      Alert.alert('Error', (e as Error).message);
    }
    setSaving(false);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <Pressable
        style={[styles.picker, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => setPickerOpen(true)}>
        <Text style={{ color: bankName ? colors.text : colors.textSecondary }}>
          {bankName || 'Select bank'}
        </Text>
      </Pressable>

      <Input
        label="Account number"
        value={accountNumber}
        onChangeText={setAccountNumber}
        keyboardType="number-pad"
        placeholder="0123456789"
      />

      <Button title="Verify account" onPress={handleResolve} loading={loading} variant="secondary" />

      {accountName ? (
        <View style={[styles.verified, { backgroundColor: brand.primary + '18' }]}>
          <Text style={{ color: brand.primary, fontWeight: '600' }}>{accountName}</Text>
        </View>
      ) : null}

      <Button title="Save bank account" onPress={handleSave} loading={saving} disabled={!accountName} />

      <Modal visible={pickerOpen} animationType="slide">
        <View style={[styles.modal, { backgroundColor: colors.background }]}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>Select Bank</Text>
          <FlatList
            data={NIGERIAN_BANKS}
            keyExtractor={(item) => item.code}
            renderItem={({ item }) => (
              <Pressable
                style={[styles.bankItem, { borderBottomColor: colors.border }]}
                onPress={() => {
                  setBankCode(item.code);
                  setBankName(item.name);
                  setPickerOpen(false);
                }}>
                <Text style={{ color: colors.text }}>{item.name}</Text>
              </Pressable>
            )}
          />
          <Button title="Cancel" onPress={() => setPickerOpen(false)} variant="secondary" />
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20 },
  picker: { borderWidth: 1, borderRadius: 10, padding: 14, marginBottom: 14 },
  verified: { padding: 14, borderRadius: 10, marginBottom: 16 },
  modal: { flex: 1, paddingTop: 60 },
  modalTitle: { fontSize: 20, fontWeight: '700', padding: 20 },
  bankItem: { padding: 16, borderBottomWidth: 1 },
});
