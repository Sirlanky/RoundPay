import { useRouter, type Href } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { ProfileSettingsRow } from '@/components/profile/ProfileSettingsRow';
import { Screen } from '@/components/Screen';
import { Card, Text } from '@/components/ui';
import { useTranslation } from '@/contexts/LanguageContext';
import { usePlan } from '@/contexts/PlanContext';
import { spacing } from '@/theme';

export default function AdminMoreScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { planName } = usePlan();

  return (
    <Screen safeArea={false} tabBarInset contentStyle={styles.content}>
      <Text variant="headingSmall" style={styles.section}>
        {t('admin.moreOperations')}
      </Text>
      <Card variant="standard" style={styles.card}>
        <ProfileSettingsRow
          icon={{ ios: 'bell.fill', android: 'notifications', web: 'notifications' }}
          label={t('nav.alerts')}
          onPress={() => router.push('/(tabs)/notifications')}
        />
        <ProfileSettingsRow
          icon={{ ios: 'person.3.fill', android: 'group', web: 'group' }}
          label={t('admin.membersHub')}
          onPress={() => router.push('/(tabs)/groups')}
        />
        <ProfileSettingsRow
          icon={{ ios: 'eye.fill', android: 'visibility', web: 'visibility' }}
          label={t('admin.transparencyCenter')}
          onPress={() => router.push('/(tabs)/transparency' as Href)}
        />
        <ProfileSettingsRow
          icon={{ ios: 'chart.pie.fill', android: 'pie_chart', web: 'pie_chart' }}
          label={t('admin.reports')}
          comingSoon
          isLast
        />
      </Card>

      <Text variant="headingSmall" style={styles.section}>
        {t('admin.moreAccount')}
      </Text>
      <Card variant="standard" style={styles.card}>
        <ProfileSettingsRow
          icon={{ ios: 'bubble.left.and.bubble.right.fill', android: 'forum', web: 'forum' }}
          label={t('nav.messages')}
          onPress={() => router.push('/(tabs)/messages')}
        />
        <ProfileSettingsRow
          icon={{ ios: 'person.circle.fill', android: 'person', web: 'person' }}
          label={t('nav.profile')}
          onPress={() => router.push('/(tabs)/profile')}
        />
        <ProfileSettingsRow
          icon={{ ios: 'checkmark.shield.fill', android: 'verified_user', web: 'verified_user' }}
          label={t('profile.identity')}
          onPress={() => router.push('/profile/identity')}
        />
        <ProfileSettingsRow
          icon={{ ios: 'creditcard.fill', android: 'credit_card', web: 'credit_card' }}
          label={t('admin.currentPlan', { plan: planName })}
          comingSoon
          isLast
        />
      </Card>

      <View style={styles.footer}>
        <Text variant="caption" color="muted" style={styles.footerText}>
          {t('admin.moreFooter')}
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: spacing.sm, paddingBottom: spacing.xl },
  section: { marginBottom: spacing.sm },
  card: { marginBottom: spacing.lg, paddingVertical: spacing.xs },
  footer: { marginTop: spacing.md },
  footerText: { textAlign: 'center', lineHeight: 18 },
});
