import { useRouter } from 'expo-router';
import { Alert, StyleSheet } from 'react-native';
import { Button } from './Button';
import { Card } from './Card';
import { Text } from '@/components/ui/Text';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/contexts/LanguageContext';
import { messageFromAuthError } from '@/lib/auth-errors';
import { spacing } from '@/theme';

interface Props {
  action: string;
}

/** Shown on flows that need a signed-in user (create/join group). */
export function AuthActionBanner({ action }: Props) {
  const { canSave, signInAsGuest } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();

  if (canSave) return null;

  return (
    <Card variant="standard" style={styles.card}>
      <Text variant="bodyMedium" style={styles.title}>
        {t('auth.enterAppTitle')}
      </Text>
      <Text variant="bodySmall" color="secondary" style={styles.body}>
        {t('auth.enterAppBody', { action })}
      </Text>
      <Button
        title={t('auth.continueAsGuest')}
        onPress={() => {
          void signInAsGuest().catch((e) =>
            Alert.alert(t('auth.couldNotEnterAppTitle'), messageFromAuthError(e))
          );
        }}
        style={styles.btn}
      />
      <Button
        title={t('auth.signInEmail')}
        variant="secondary"
        onPress={() => router.push('/(auth)/login')}
        style={styles.btn}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.md },
  title: { fontWeight: '700', marginBottom: spacing.xs },
  body: { lineHeight: 20 },
  btn: { marginTop: spacing.sm, marginBottom: 0 },
});
