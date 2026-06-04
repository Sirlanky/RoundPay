import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';
import { AuthActionBanner } from '@/components/AuthActionBanner';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { GroupJoinPreviewCard } from '@/components/GroupJoinPreviewCard';
import { Input } from '@/components/Input';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/contexts/AuthContext';
import Colors from '@/constants/Colors';
import { messageFromGroupError } from '@/lib/group-errors';
import { isValidInviteCode } from '@/lib/group-validation';
import { joinGroup, previewGroupByInviteCode, type GroupJoinPreview } from '@/lib/groups';
import { promptSaveAuth } from '@/lib/prompt-save-auth';
import { spacing } from '@/constants/theme';
import { useColorScheme } from '@/components/useColorScheme';

export default function JoinGroupScreen() {
  const { user, exitBuildMode, signInAsGuest } = useAuth();
  const { code } = useLocalSearchParams<{ code?: string }>();
  const [inviteCode, setInviteCode] = useState(code?.toString().toUpperCase() ?? '');
  const [preview, setPreview] = useState<GroupJoinPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  useEffect(() => {
    if (code) setInviteCode(code.toString().toUpperCase());
  }, [code]);

  const loadPreview = useCallback(async (raw: string) => {
    const normalized = raw.trim().toUpperCase();
    if (!isValidInviteCode(normalized)) {
      setPreview(null);
      setPreviewLoading(false);
      return;
    }
    setPreviewLoading(true);
    const data = await previewGroupByInviteCode(normalized);
    setPreview(data);
    setPreviewLoading(false);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => loadPreview(inviteCode), 400);
    return () => clearTimeout(t);
  }, [inviteCode, loadPreview]);

  const handleJoin = async () => {
    if (!user) {
      promptSaveAuth({
        action: 'join a group',
        onSignIn: () => {
          exitBuildMode();
          router.replace('/(auth)/login');
        },
        onGuest: async () => {
          setLoading(true);
          try {
            const guest = await signInAsGuest();
            const group = await joinGroup(inviteCode.trim(), guest.id);
            router.replace(`/group/${group.id}`);
          } catch (e) {
            Alert.alert('Could not join', messageFromGroupError(e));
          }
          setLoading(false);
        },
      });
      return;
    }
    if (!isValidInviteCode(inviteCode)) {
      Alert.alert('Invalid code', 'Invite codes are 6 characters (letters and numbers).');
      return;
    }
    if (!preview) {
      Alert.alert('Group not found', 'Check the code or ask your admin for a new one.');
      return;
    }
    if (preview.member_count >= preview.max_members) {
      Alert.alert('Group full', 'This group has no spots left.');
      return;
    }

    setLoading(true);
    try {
      const group = await joinGroup(inviteCode.trim(), user.id);
      router.replace(`/group/${group.id}`);
    } catch (e) {
      Alert.alert('Could not join', messageFromGroupError(e));
    }
    setLoading(false);
  };

  const canJoin =
    !!user &&
    !!preview &&
    preview.member_count < preview.max_members &&
    isValidInviteCode(inviteCode);

  return (
    <Screen keyboard safeArea={false} contentStyle={styles.content}>
      <Text style={[styles.lead, { color: colors.textSecondary }]}>
        Enter the 6-character code from your group admin. You can only join while the group is still in{' '}
        <Text style={styles.em}>draft</Text> (before the first cycle starts).
      </Text>

      <AuthActionBanner action="join a group" />

      <Card>
        <Input
          label="Invite code"
          value={inviteCode}
          onChangeText={(t) => setInviteCode(t.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
          placeholder="ABC123"
          autoCapitalize="characters"
          maxLength={6}
        />
      </Card>

      <GroupJoinPreviewCard preview={preview} loading={previewLoading} code={inviteCode} />

      <Button title="Join group" onPress={handleJoin} loading={loading} disabled={!canJoin} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: spacing.sm },
  lead: { fontSize: 15, lineHeight: 22, marginBottom: spacing.md },
  em: { fontWeight: '700', fontStyle: 'italic' },
});
