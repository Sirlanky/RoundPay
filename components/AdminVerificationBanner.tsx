import { useRouter } from 'expo-router';
import { StyleSheet } from 'react-native';
import { Button } from './Button';
import { Card } from './Card';
import { Text } from '@/components/ui/Text';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/contexts/LanguageContext';
import {
  identityStatusFromProfile,
  isVerifiedAdmin,
} from '@/lib/identity-verification';
import { spacing } from '@/theme';

/** Blocks group admin flows until identity is verified. */
export function AdminVerificationBanner() {
  const { profile, canSave } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();

  if (!canSave || isVerifiedAdmin(profile)) return null;

  const status = identityStatusFromProfile(profile);
  const bodyKey =
    status === 'in_review' ? 'groupAdmin.verifyRequiredInReview' : 'groupAdmin.verifyRequiredNotStarted';

  return (
    <Card variant="standard" style={styles.card}>
      <Text variant="bodyMedium" style={styles.title}>
        {t('groupAdmin.verifyRequiredTitle')}
      </Text>
      <Text variant="bodySmall" color="secondary" style={styles.body}>
        {t(bodyKey)}
      </Text>
      <Button
        title={t('groupAdmin.verifyButton')}
        onPress={() => router.push('/profile/identity')}
        style={styles.btn}
      />
    </Card>
  );
}

export function useCanAdministerGroup(): boolean {
  const { profile, canSave } = useAuth();
  return canSave && isVerifiedAdmin(profile);
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.md },
  title: { fontWeight: '700', marginBottom: spacing.xs },
  body: { lineHeight: 20 },
  btn: { marginTop: spacing.sm, marginBottom: 0 },
});
