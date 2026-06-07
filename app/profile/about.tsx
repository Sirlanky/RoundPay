import Constants from 'expo-constants';
import { useLayoutEffect } from 'react';
import { StyleSheet } from 'react-native';
import { useNavigation, useRouter } from 'expo-router';
import { Button, Card, Text } from '@/components/ui';
import { Screen } from '@/components/Screen';
import { useTranslation } from '@/contexts/LanguageContext';
import { spacing } from '@/theme';

const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';

export default function AboutScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const router = useRouter();

  useLayoutEffect(() => {
    navigation.setOptions({ title: t('profile.about') });
  }, [navigation, t]);

  return (
    <Screen contentStyle={styles.content}>
      <Card variant="elevated" style={styles.hero}>
        <Text variant="headingMedium">RoundPay</Text>
        <Text variant="bodySmall" color="secondary" style={styles.tagline}>
          {t('about.tagline')}
        </Text>
        <Text variant="caption" color="secondary" style={styles.version}>
          {t('about.version', { version: APP_VERSION })}
        </Text>
      </Card>

      <Card variant="standard" style={styles.card}>
        <Text variant="bodyMedium" style={styles.sectionTitle}>
          {t('about.missionTitle')}
        </Text>
        <Text variant="bodySmall" color="secondary" style={styles.sectionBody}>
          {t('about.missionBody')}
        </Text>
      </Card>

      <Button title={t('profile.helpCenter')} onPress={() => router.push('/profile/help')} variant="secondary" />
      <Button title={t('profile.termsPrivacy')} onPress={() => router.push('/profile/terms')} variant="secondary" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xl, gap: spacing.sm },
  hero: { marginBottom: spacing.xs },
  tagline: { marginTop: spacing.xs, lineHeight: 20 },
  version: { marginTop: spacing.sm },
  card: { marginBottom: spacing.xs },
  sectionTitle: { fontWeight: '700', marginBottom: spacing.xs },
  sectionBody: { lineHeight: 20 },
});
