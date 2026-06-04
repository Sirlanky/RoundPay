import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { AuthActionBanner } from '@/components/AuthActionBanner';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Input } from '@/components/Input';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/contexts/AuthContext';
import Colors, { brand } from '@/constants/Colors';
import { NIGERIAN_BANKS } from '@/constants/banks';
import { bankAuthMessage, getAccessToken, mapPaystackFunctionError } from '@/lib/auth-session';
import { resolveBankAccount, saveBankAccount } from '@/lib/paystack';
import { spacing } from '@/constants/theme';
import { useColorScheme } from '@/components/useColorScheme';

export default function BankScreen() {
  const { user, buildMode, refreshProfile } = useAuth();
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

  const signedIn = !!user && !buildMode;

  const ensureSignedIn = async (): Promise<boolean> => {
    const token = await getAccessToken();
    if (token && user) return true;
    Alert.alert('Sign in required', bankAuthMessage({ buildMode, hasUser: !!user }));
    return false;
  };

  const handleResolve = async () => {
    if (!accountNumber || !bankCode) {
      Alert.alert('Missing info', 'Select a bank and enter your account number.');
      return;
    }
    if (!(await ensureSignedIn())) return;

    setLoading(true);
    try {
      const result = await resolveBankAccount(accountNumber, bankCode);
      setAccountName(result.account_name);
    } catch (e) {
      Alert.alert('Could not verify', mapPaystackFunctionError((e as Error).message));
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!accountName) {
      Alert.alert('Verify first', 'Tap verify account before saving.');
      return;
    }
    if (!(await ensureSignedIn())) return;

    setSaving(true);
    try {
      await saveBankAccount({
        account_number: accountNumber,
        bank_code: bankCode,
        bank_name: bankName,
        account_name: accountName,
      });
      await refreshProfile();
      Alert.alert('Saved', 'Bank account linked for payouts.');
      router.back();
    } catch (e) {
      Alert.alert('Could not save', mapPaystackFunctionError((e as Error).message));
    }
    setSaving(false);
  };

  return (
    <Screen keyboard safeArea={false} contentStyle={styles.content}>
      <AuthActionBanner action="link a bank account" />

      <Text style={[styles.hint, { color: colors.textSecondary }]}>
        We use Paystack to verify your account and send payouts when it is your turn to collect.
      </Text>

      <Pressable
        style={[styles.picker, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => setPickerOpen(true)}
        disabled={!signedIn}>
        <Text style={{ color: bankName ? colors.text : colors.textSecondary, fontSize: 16 }}>
          {bankName || 'Select bank'}
        </Text>
      </Pressable>

      <Input
        label="Account number"
        value={accountNumber}
        onChangeText={setAccountNumber}
        keyboardType="number-pad"
        placeholder="0123456789"
        editable={signedIn}
      />

      <Button
        title="Verify account"
        onPress={handleResolve}
        loading={loading}
        variant="secondary"
        disabled={!signedIn}
      />

      {accountName ? (
        <Card style={{ marginTop: spacing.sm }}>
          <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Account name</Text>
          <Text style={{ color: brand.primary, fontWeight: '600', fontSize: 16, marginTop: 4 }}>
            {accountName}
          </Text>
        </Card>
      ) : null}

      <Button
        title="Save bank account"
        onPress={handleSave}
        loading={saving}
        disabled={!signedIn || !accountName}
      />

      <Modal visible={pickerOpen} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaBankPicker
          colors={colors}
          onSelect={(code, name) => {
            setBankCode(code);
            setBankName(name);
            setPickerOpen(false);
          }}
          onClose={() => setPickerOpen(false)}
        />
      </Modal>
    </Screen>
  );
}

function SafeAreaBankPicker({
  colors,
  onSelect,
  onClose,
}: {
  colors: (typeof Colors)['light'];
  onSelect: (code: string, name: string) => void;
  onClose: () => void;
}) {
  return (
    <View style={[styles.modal, { backgroundColor: colors.background }]}>
      <Text style={[styles.modalTitle, { color: colors.text }]}>Select bank</Text>
      <FlatList
        data={NIGERIAN_BANKS}
        keyExtractor={(item) => item.code}
        renderItem={({ item }) => (
          <Pressable
            style={[styles.bankItem, { borderBottomColor: colors.border }]}
            onPress={() => onSelect(item.code, item.name)}>
            <Text style={{ color: colors.text, fontSize: 16 }}>{item.name}</Text>
          </Pressable>
        )}
      />
      <View style={{ padding: spacing.lg }}>
        <Button title="Cancel" onPress={onClose} variant="secondary" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: spacing.sm },
  hint: { fontSize: 14, lineHeight: 20, marginBottom: spacing.lg },
  picker: { borderWidth: 1, borderRadius: 10, padding: 14, marginBottom: spacing.md },
  modal: { flex: 1, paddingTop: 56 },
  modalTitle: { fontSize: 20, fontWeight: '700', paddingHorizontal: spacing.lg, marginBottom: spacing.sm },
  bankItem: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: 1 },
});
