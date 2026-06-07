import { useLayoutEffect } from 'react';
import { StyleSheet } from 'react-native';
import { useNavigation } from 'expo-router';
import { Card, Text } from '@/components/ui';
import { Screen } from '@/components/Screen';
import { useTranslation } from '@/contexts/LanguageContext';
import type { TranslationKey } from '@/lib/i18n/keys';
import { spacing } from '@/theme';

const SECTIONS: { title: TranslationKey; body: TranslationKey }[] = [
  { title: 'terms.section1Title', body: 'terms.section1Body' },
  { title: 'terms.section2Title', body: 'terms.section2Body' },
  { title: 'terms.privacyTitle', body: 'terms.privacyBody' },
];

export default function TermsPrivacyScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({ title: t('profile.termsPrivacy') });
  }, [navigation, t]);

  return (
    <Screen contentStyle={styles.content}>
      <Text variant="caption" color="secondary" style={styles.updated}>
        {t('terms.lastUpdated')}
      </Text>
      <Text variant="bodyMedium" color="secondary" style={styles.intro}>
        {t('terms.intro')}
      </Text>

      {SECTIONS.map((section) => (
        <Card key={section.title} variant="standard" style={styles.card}>
          <Text variant="bodyMedium" style={styles.sectionTitle}>
            {t(section.title)}
          </Text>
          <Text variant="bodySmall" color="secondary" style={styles.sectionBody}>
            {t(section.body)}
          </Text>
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xl },
  updated: { marginBottom: spacing.xs },
  intro: { marginBottom: spacing.md, lineHeight: 22 },
  card: { marginBottom: spacing.sm },
  sectionTitle: { fontWeight: '700', marginBottom: spacing.xs },
  sectionBody: { lineHeight: 20 },
});
