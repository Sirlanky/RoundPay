import * as Clipboard from 'expo-clipboard';
import { useLayoutEffect } from 'react';
import { Alert, Linking, StyleSheet } from 'react-native';
import { useNavigation } from 'expo-router';
import { Button, Card, Text } from '@/components/ui';
import { Screen } from '@/components/Screen';
import { useTranslation } from '@/contexts/LanguageContext';
import { SUPPORT_EMAIL } from '@/lib/support';
import { spacing } from '@/theme';

export default function ContactSupportScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({ title: t('profile.contactSupport') });
  }, [navigation, t]);

  const copyEmail = async () => {
    await Clipboard.setStringAsync(SUPPORT_EMAIL);
    Alert.alert(t('support.copiedTitle'), t('support.copiedBody'));
  };

  const openEmail = () => {
    const subject = encodeURIComponent('RoundPay support request');
    const body = encodeURIComponent('Describe your issue or question:\n\n');
    void Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`);
  };

  return (
    <Screen contentStyle={styles.content}>
      <Text variant="bodyMedium" color="secondary" style={styles.hint}>
        {t('support.hint')}
      </Text>

      <Card variant="elevated" style={styles.card}>
        <Text variant="caption" color="secondary">
          {t('support.emailLabel')}
        </Text>
        <Text variant="headingSmall" style={styles.email}>
          {SUPPORT_EMAIL}
        </Text>
        <Text variant="bodySmall" color="secondary" style={styles.response}>
          {t('support.responseHint')}
        </Text>
      </Card>

      <Button title={t('support.openEmail')} onPress={openEmail} />
      <Button title={t('support.copyEmail')} onPress={() => void copyEmail()} variant="secondary" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xl, gap: spacing.sm },
  hint: { marginBottom: spacing.sm, lineHeight: 22 },
  card: { marginBottom: spacing.sm },
  email: { marginTop: spacing.xs, marginBottom: spacing.sm },
  response: { lineHeight: 20 },
});
