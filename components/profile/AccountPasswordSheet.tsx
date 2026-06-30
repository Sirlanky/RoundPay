import { useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/contexts/LanguageContext';
import { hasAccountPasswordSet, markAccountPasswordSet } from '@/lib/account-password-preference';
import { messageFromAuthError } from '@/lib/auth-errors';
import { isValidAuthPassword, updateAccountPassword } from '@/lib/password-sign-in';
import { radius, spacing, useThemeTokens } from '@/theme';

interface Props {
  visible: boolean;
  onClose: () => void;
  onChanged?: () => void;
}

export function AccountPasswordSheet({ visible, onClose, onChanged }: Props) {
  const { user, accountMode } = useAuth();
  const { t } = useTranslation();
  const { colors } = useThemeTokens();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasPassword, setHasPassword] = useState(false);

  const isGuest = accountMode === 'guest';
  const profileEmail = user?.email?.trim() ?? '';

  useEffect(() => {
    if (!visible) return;
    setPassword('');
    setConfirmPassword('');
    setError('');
    void hasAccountPasswordSet(user?.id).then(setHasPassword);
  }, [visible, user?.id]);

  const handleSave = async () => {
    if (isGuest || !profileEmail) {
      setError(t('security.password.guestHint'));
      return;
    }
    if (!password) {
      setError(t('auth.enterPasswordError'));
      return;
    }
    if (!isValidAuthPassword(password)) {
      setError(t('auth.passwordTooShort'));
      return;
    }
    if (password !== confirmPassword) {
      setError(t('auth.passwordMismatch'));
      return;
    }

    setLoading(true);
    setError('');

    const { error: authError } = await updateAccountPassword(password);

    setLoading(false);

    if (authError) {
      setError(messageFromAuthError(authError));
      return;
    }

    if (user?.id) {
      await markAccountPasswordSet(user.id);
    }
    setHasPassword(true);
    onChanged?.();

    Alert.alert(t('security.password.savedTitle'), t('security.password.savedBody'), [
      { text: t('common.ok'), onPress: onClose },
    ]);
  };

  const title = hasPassword ? t('security.password.change') : t('security.password.set');

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
          <Text style={[styles.hint, { color: colors.textSecondary }]}>{t('security.password.hint')}</Text>

          {profileEmail ? (
            <Text style={[styles.email, { color: colors.textMuted }]}>
              {t('security.password.accountEmail', { email: profileEmail })}
            </Text>
          ) : null}

          {isGuest ? (
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.cardBody, { color: colors.textSecondary }]}>{t('security.password.guestHint')}</Text>
            </View>
          ) : (
            <>
              <Input
                label={t('auth.passwordLabel')}
                placeholder={t('auth.passwordPlaceholder')}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="new-password"
                error={error}
                editable={!loading}
              />
              <Input
                label={t('auth.confirmPasswordLabel')}
                placeholder={t('auth.confirmPasswordPlaceholder')}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="new-password"
                editable={!loading}
              />
              <Button
                title={hasPassword ? t('security.password.change') : t('security.password.set')}
                onPress={() => void handleSave()}
                loading={loading}
              />
            </>
          )}
        </ScrollView>
        <View style={styles.footer}>
          <Button title={t('common.done')} onPress={onClose} variant="secondary" />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.md, gap: spacing.md },
  title: { fontSize: 22, fontWeight: '700' },
  hint: { fontSize: 14, lineHeight: 20 },
  email: { fontSize: 13, lineHeight: 18 },
  card: {
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  cardBody: { fontSize: 13, lineHeight: 19 },
  footer: { padding: spacing.lg, paddingTop: spacing.sm },
});
