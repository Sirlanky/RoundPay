import { useRouter } from 'expo-router';
import { StyleSheet } from 'react-native';
import { Button } from './Button';
import { Card } from './Card';
import { Text } from '@/components/ui/Text';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/contexts/LanguageContext';
import { spacing } from '@/theme';

interface Props {
  action: string;
}

/** Shown when a signed-in email account is required. */
export function AuthActionBanner({ action }: Props) {
  const { canSave } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();

  if (canSave) return null;

  return (
    <Card variant="standard" style={styles.card}>
      <Text variant="bodyMedium" style={styles.title}>
        {t('auth.signInRequiredTitle')}
      </Text>
      <Text variant="bodySmall" color="secondary" style={styles.body}>
        {t('auth.signInRequiredBody', { action })}
      </Text>
      <Button
        title={t('auth.signInEmail')}
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
