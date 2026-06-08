import { useLocalSearchParams, useRouter, useNavigation, type Href } from 'expo-router';
import { useLayoutEffect } from 'react';
import { StyleSheet } from 'react-native';
import { ProfileSettingsRow } from '@/components/profile/ProfileSettingsRow';
import { Screen } from '@/components/Screen';
import { Card, Text } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/contexts/LanguageContext';
import { useGroup } from '@/hooks/useGroup';
import { isGroupAdmin } from '@/lib/admin/role';
import { spacing } from '@/theme';

export default function GroupAdminScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const groupId = typeof id === 'string' ? id : '';
  const { user } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();
  const navigation = useNavigation();
  const { group, loading } = useGroup(groupId);

  const isAdmin = group ? isGroupAdmin(group, user?.id) : false;

  useLayoutEffect(() => {
    navigation.setOptions({ title: t('admin.groupAdminTitle') });
  }, [navigation, t]);

  if (loading || !group) {
    return (
      <Screen contentStyle={styles.content}>
        <Text variant="bodyMedium" color="secondary">
          {t('common.loading')}
        </Text>
      </Screen>
    );
  }

  if (!isAdmin) {
    return (
      <Screen contentStyle={styles.content}>
        <Text variant="bodyMedium">{t('admin.groupAdminDenied')}</Text>
      </Screen>
    );
  }

  return (
    <Screen contentStyle={styles.content}>
      <Text variant="headingMedium" style={styles.title}>
        {group.name}
      </Text>
      <Text variant="bodySmall" color="secondary" style={styles.subtitle}>
        {t('admin.groupAdminSubtitle')}
      </Text>

      <Card variant="standard" style={styles.card}>
        <ProfileSettingsRow
          icon={{ ios: 'slider.horizontal.3', android: 'tune', web: 'tune' }}
          label={t('admin.manageGroup')}
          onPress={() => router.push(`/group/${groupId}`)}
        />
        <ProfileSettingsRow
          icon={{ ios: 'list.bullet.rectangle', android: 'receipt_long', web: 'receipt_long' }}
          label={t('admin.viewLedger')}
          onPress={() => router.push('/(tabs)/ledger' as Href)}
        />
        <ProfileSettingsRow
          icon={{ ios: 'arrow.up.circle.fill', android: 'north', web: 'north' }}
          label={t('nav.payouts')}
          onPress={() => router.push('/(tabs)/payouts' as Href)}
        />
        <ProfileSettingsRow
          icon={{ ios: 'person.badge.plus', android: 'person_add', web: 'person_add' }}
          label={t('admin.inviteMembers')}
          onPress={() => router.push(`/group/${groupId}/invite`)}
        />
        <ProfileSettingsRow
          icon={{ ios: 'calendar', android: 'calendar_month', web: 'calendar_month' }}
          label={t('admin.viewSchedule')}
          onPress={() => router.push(`/group/${groupId}/schedule`)}
        />
        <ProfileSettingsRow
          icon={{ ios: 'note.text', android: 'sticky_note_2', web: 'sticky_note_2' }}
          label={t('admin.groupNotes')}
          comingSoon
          isLast
        />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xl },
  title: { marginBottom: spacing.xs },
  subtitle: { marginBottom: spacing.lg, lineHeight: 20 },
  card: { paddingVertical: spacing.xs },
});
