import { Pressable, StyleSheet, View } from 'react-native';
import { PlatformIcon } from '@/components/navigation/PlatformIcon';
import { HomeSectionTitle } from './HomeSectionTitle';
import { Text } from '@/components/ui';
import { spacing, useThemeTokens } from '@/theme';

interface Props {
  groupId: string | null;
  isDraft: boolean;
  showPayNow: boolean;
  showViewPayments: boolean;
  showAdminPayments: boolean;
  onInvite: () => void;
  onSchedule: () => void;
  onDetails: () => void;
  onPay: () => void;
  onViewPayments: () => void;
}

export function HomeQuickActions({
  groupId,
  isDraft,
  showPayNow,
  showViewPayments,
  showAdminPayments,
  onInvite,
  onSchedule,
  onDetails,
  onPay,
  onViewPayments,
}: Props) {
  const { colors, radius } = useThemeTokens();

  if (!groupId) return null;

  const actions: Array<{
    key: string;
    label: string;
    icon: { ios: string; android: string; web: string };
    onPress: () => void;
  }> = [];

  if (isDraft) {
    actions.push({
      key: 'invite',
      label: 'Invite',
      icon: { ios: 'square.and.arrow.up', android: 'share', web: 'share' },
      onPress: onInvite,
    });
  }

  actions.push(
    {
      key: 'schedule',
      label: 'Schedule',
      icon: { ios: 'calendar', android: 'event', web: 'event' },
      onPress: onSchedule,
    },
    {
      key: 'details',
      label: 'Details',
      icon: { ios: 'info.circle', android: 'info', web: 'info' },
      onPress: onDetails,
    }
  );

  if (showPayNow) {
    actions.push({
      key: 'pay',
      label: 'Pay now',
      icon: { ios: 'creditcard.fill', android: 'payment', web: 'payment' },
      onPress: onPay,
    });
  } else if (showViewPayments) {
    actions.push({
      key: 'payments',
      label: 'Payments',
      icon: { ios: 'list.bullet.rectangle', android: 'receipt', web: 'receipt' },
      onPress: onViewPayments,
    });
  } else if (showAdminPayments) {
    actions.push({
      key: 'record',
      label: 'Record',
      icon: { ios: 'checkmark.circle', android: 'check', web: 'check' },
      onPress: onViewPayments,
    });
  }

  return (
    <View style={styles.wrap}>
      <HomeSectionTitle title="Quick actions" />
      <View style={styles.grid}>
        {actions.map((action) => (
          <Pressable
            key={action.key}
            onPress={action.onPress}
            style={({ pressed }) => [
              styles.tile,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderRadius: radius.md + 2,
                opacity: pressed ? 0.85 : 1,
              },
            ]}>
            <PlatformIcon name={action.icon} color={colors.primary} size={22} />
            <Text variant="caption" style={{ fontWeight: '600' }}>
              {action.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tile: {
    width: '30%',
    minWidth: 96,
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderWidth: 1,
    gap: 6,
  },
});
