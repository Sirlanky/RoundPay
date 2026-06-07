import { useLayoutEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation } from 'expo-router';
import { Card, Text } from '@/components/ui';
import { Screen } from '@/components/Screen';
import { useTranslation } from '@/contexts/LanguageContext';
import { HELP_FAQ_KEYS } from '@/lib/support';
import { spacing } from '@/theme';

export default function HelpCenterScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({ title: t('profile.helpCenter') });
  }, [navigation, t]);

  return (
    <Screen contentStyle={styles.content}>
      <Text variant="bodyMedium" color="secondary" style={styles.hint}>
        {t('help.hint')}
      </Text>

      {HELP_FAQ_KEYS.map((item) => (
        <Card key={item.question} variant="standard" style={styles.card}>
          <Text variant="bodyMedium" style={styles.question}>
            {t(item.question)}
          </Text>
          <Text variant="bodySmall" color="secondary" style={styles.answer}>
            {t(item.answer)}
          </Text>
        </Card>
      ))}

      <View style={styles.footer}>
        <Text variant="caption" color="secondary">
          {t('help.footer')}
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xl },
  hint: { marginBottom: spacing.md, lineHeight: 22 },
  card: { marginBottom: spacing.sm },
  question: { fontWeight: '700', marginBottom: spacing.xs },
  answer: { lineHeight: 20 },
  footer: { marginTop: spacing.md },
});
