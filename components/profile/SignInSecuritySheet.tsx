import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/ui';
import { Input } from '@/components/Input';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/contexts/LanguageContext';
import { messageFromAuthError } from '@/lib/auth-errors';
import { isValidSignInEmail, requestEmailSignIn } from '@/lib/email-sign-in';
import { radius, spacing, useThemeTokens } from '@/theme';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function SignInSecuritySheet({ visible, onClose }: Props) {
  const { user, accountMode } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();
  const { colors } = useThemeTokens();
  const profileEmail = user?.email?.trim() ?? '';
  const [email, setEmail] = useState(profileEmail);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isGuest = accountMode === 'guest';

  const sendCode = async () => {
    const targetEmail = (isGuest ? email : profileEmail).trim();
    if (!targetEmail) {
      setError(t('auth.enterEmailError'));
      return;
    }
    if (!isValidSignInEmail(targetEmail)) {
      setError(t('auth.invalidEmail'));
      return;
    }

    setLoading(true);
    setError('');
    const { error: authError } = await requestEmailSignIn(targetEmail);
    setLoading(false);

    if (authError) {
      Alert.alert(t('security.signIn.sendFailedTitle'), messageFromAuthError(authError));
      return;
    }

    onClose();
    router.push({ pathname: '/(auth)/verify-otp', params: { email: targetEmail.toLowerCase() } });
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>{t('security.signIn.title')}</Text>
          <Text style={[styles.hint, { color: colors.textSecondary }]}>{t('security.signIn.hint')}</Text>

          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{t('security.signIn.passwordlessTitle')}</Text>
            <Text style={[styles.cardBody, { color: colors.textSecondary }]}>
              {t('security.signIn.passwordlessBody')}
            </Text>
          </View>

          {isGuest ? (
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{t('security.signIn.guestTitle')}</Text>
              <Text style={[styles.cardBody, { color: colors.textSecondary }]}>{t('auth.linkingGuestNote')}</Text>
              <Input
                label={t('auth.emailLabel')}
                placeholder={t('auth.emailPlaceholder')}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                error={error}
              />
              <Button title={t('auth.linkEmailButton')} onPress={() => void sendCode()} loading={loading} />
            </View>
          ) : profileEmail ? (
            <Button title={t('security.signIn.sendCode')} onPress={() => void sendCode()} loading={loading} />
          ) : (
            <Button
              title={t('security.signIn.switchEmail')}
              onPress={() => {
                onClose();
                router.push('/(auth)/login');
              }}
            />
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
  card: {
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.sm,
  },
  cardTitle: { fontSize: 15, fontWeight: '600' },
  cardBody: { fontSize: 13, lineHeight: 19 },
  footer: { padding: spacing.lg, paddingTop: spacing.sm },
});
