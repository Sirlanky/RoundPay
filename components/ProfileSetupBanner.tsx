import { useRouter } from 'expo-router';
import { StyleSheet } from 'react-native';
import { Button, Card, Text } from '@/components/ui';
import { useTranslation } from '@/contexts/LanguageContext';
import { getProfileSetupSummary } from '@/lib/profile-setup';
import { promptProfileSetupForTransfer } from '@/lib/prompt-profile-setup';
import type { Profile } from '@/lib/types';
import { spacing } from '@/theme';

interface Props {
  profile: Profile | null | undefined;
}

export function ProfileSetupBanner({ profile }: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const { ready } = getProfileSetupSummary(profile);

  if (ready) return null;

  return (
    <Card variant="standard" style={styles.card}>
      <Text variant="bodyMedium" style={{ fontWeight: '700' }}>
        {t('profileSetup.bannerTitle')}
      </Text>
      <Text variant="bodySmall" color="secondary" style={styles.body}>
        {t('profileSetup.bannerBody')}
      </Text>
      <Button
        title={t('profileSetup.completeSetup')}
        onPress={() => promptProfileSetupForTransfer(profile, router, t)}
        style={styles.btn}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.md },
  body: { marginTop: spacing.xs, marginBottom: spacing.sm, lineHeight: 20 },
  btn: { marginBottom: 0 },
});
