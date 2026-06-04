import * as Clipboard from 'expo-clipboard';
import { Alert, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { Button } from './Button';
import { useColorScheme } from './useColorScheme';
import Colors, { brand } from '@/constants/Colors';
import { spacing } from '@/constants/theme';

interface Props {
  groupName: string;
  inviteCode: string;
}

export function InviteCodeCard({ groupName, inviteCode }: Props) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  const copyCode = async () => {
    await Clipboard.setStringAsync(inviteCode);
    Alert.alert('Copied', 'Invite code copied to clipboard.');
  };

  const shareInvite = async () => {
    const link = `ajoesusu://join/${inviteCode}`;
    await Share.share({
      message: `Join "${groupName}" on Ajo Esusu!\n\nInvite code: ${inviteCode}\n${link}`,
    });
  };

  return (
    <View style={[styles.box, { backgroundColor: colors.background }]}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>Invite code</Text>
      <Pressable onPress={copyCode} accessibilityRole="button" accessibilityLabel="Copy invite code">
        <Text style={[styles.code, { color: colors.text }]}>{inviteCode}</Text>
        <Text style={[styles.tapHint, { color: brand.primary }]}>Tap code to copy</Text>
      </Pressable>
      <View style={styles.actions}>
        <Button title="Copy code" onPress={copyCode} variant="secondary" style={styles.btn} />
        <Button title="Share" onPress={shareInvite} variant="secondary" style={styles.btn} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { marginTop: spacing.md, padding: spacing.md, borderRadius: 10 },
  label: { fontSize: 12, fontWeight: '500' },
  code: { fontSize: 28, fontWeight: '800', letterSpacing: 3, marginTop: spacing.xs },
  tapHint: { fontSize: 12, fontWeight: '600', marginTop: 4 },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  btn: { flex: 1, marginVertical: 0 },
});
