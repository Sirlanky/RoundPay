import * as Clipboard from 'expo-clipboard';
import { Alert, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/ui';
import { PlatformIcon } from '@/components/navigation/PlatformIcon';
import { spacing, useThemeTokens } from '@/theme';

interface Props {
  groupName: string;
  inviteCode: string;
  /** Tighter layout for the group hero card. */
  compact?: boolean;
}

export function InviteCodeCard({ groupName, inviteCode, compact }: Props) {
  const { colors, radius } = useThemeTokens();

  const copyCode = async () => {
    await Clipboard.setStringAsync(inviteCode);
    Alert.alert('Copied', 'Invite code copied to clipboard.');
  };

  const shareInvite = async () => {
    const link = `roundpayajo://join/${inviteCode}`;
    await Share.share({
      message: `Join "${groupName}" on RoundPayAjo!\n\nInvite code: ${inviteCode}\n${link}`,
    });
  };

  if (compact) {
    return (
      <View style={[styles.compactBox, { backgroundColor: colors.surfaceSecondary, borderRadius: radius.md }]}>
        <Pressable onPress={copyCode} style={styles.compactMain}>
          <Text style={[styles.compactLabel, { color: colors.textSecondary }]}>Invite code</Text>
          <Text style={[styles.compactCode, { color: colors.textPrimary }]}>{inviteCode}</Text>
        </Pressable>
        <Pressable
          onPress={shareInvite}
          style={({ pressed }) => [
            styles.shareBtn,
            { backgroundColor: colors.primary, borderRadius: radius.md, opacity: pressed ? 0.9 : 1 },
          ]}>
          <PlatformIcon
            name={{ ios: 'square.and.arrow.up', android: 'share', web: 'share' }}
            size={18}
            color="#fff"
          />
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.box, { backgroundColor: colors.background }]}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>Invite code</Text>
      <Pressable onPress={copyCode} accessibilityRole="button" accessibilityLabel="Copy invite code">
        <Text style={[styles.code, { color: colors.textPrimary }]}>{inviteCode}</Text>
        <Text style={[styles.tapHint, { color: colors.primary }]}>Tap code to copy</Text>
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
  compactBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    padding: spacing.sm,
    gap: spacing.sm,
  },
  compactMain: { flex: 1, paddingHorizontal: spacing.xs },
  compactLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 },
  compactCode: { fontSize: 22, fontWeight: '800', letterSpacing: 2, marginTop: 2 },
  shareBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
