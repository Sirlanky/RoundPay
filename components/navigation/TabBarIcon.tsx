import { StyleSheet, Text, View } from 'react-native';
import { PlatformIcon, type PlatformIconName } from '@/components/navigation/PlatformIcon';
import { primaryAlpha, useThemeTokens } from '@/theme';

interface Props {
  focused: boolean;
  color: string;
  name: PlatformIconName;
  badge?: number;
  plain?: boolean;
}

export const TAB_ICON_SIZE = 26;

export function TabBarIcon({ focused, color, name, badge, plain }: Props) {
  const { colors, scheme } = useThemeTokens();
  const showLocalPill = focused && !plain;
  const activeBg = primaryAlpha(scheme, 16);
  const badgeBorder = focused && plain ? colors.primary : colors.surface;

  return (
    <View style={styles.wrap}>
      <View style={[styles.iconShell, showLocalPill && { backgroundColor: activeBg, borderRadius: 18 }]}>
        <PlatformIcon name={name} color={color} size={TAB_ICON_SIZE} />
      </View>
      {badge && badge > 0 ? (
        <View style={[styles.badge, { borderColor: badgeBorder, backgroundColor: colors.error }]}>
          <Text style={[styles.badgeText, { color: colors.textInverse }]}>{badge > 99 ? '99+' : badge}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: 44,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconShell: {
    width: 44,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -3,
    right: -4,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 5,
    borderRadius: 9,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    lineHeight: 12,
  },
});
