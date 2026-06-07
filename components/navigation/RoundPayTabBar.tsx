import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BottomTabBarHeightCallbackContext } from '@react-navigation/bottom-tabs';
import { useCallback, useContext } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { TabBarIcon } from '@/components/navigation/TabBarIcon';
import { TAB_BAR_FLOAT_GAP } from '@/components/navigation/tab-bar-layout';
import { TAB_CONFIG, type TabRouteName } from '@/components/navigation/tab-bar-config';
import { useTranslation } from '@/contexts/LanguageContext';
import { useNotificationUnreadCount } from '@/contexts/NotificationsContext';
import { navigationRadius, spacing, typography, useThemeTokens } from '@/theme';

function isTabRoute(name: string): name is TabRouteName {
  return name in TAB_CONFIG;
}

export function RoundPayTabBar({ state, navigation, insets }: BottomTabBarProps) {
  const { t } = useTranslation();
  const theme = useThemeTokens();
  const { colors, shadow } = theme;
  const unreadCount = useNotificationUnreadCount();
  const onHeightChange = useContext(BottomTabBarHeightCallbackContext);

  const bottomInset = insets.bottom;
  const focusedKey = state.routes[state.index]?.key;

  const onLayout = useCallback(
    (e: { nativeEvent: { layout: { height: number } } }) => {
      onHeightChange?.(e.nativeEvent.layout.height);
    },
    [onHeightChange],
  );

  return (
    <View
      onLayout={onLayout}
      pointerEvents="box-none"
      style={[styles.outer, { paddingBottom: bottomInset + TAB_BAR_FLOAT_GAP }]}>
      <View
        style={[
          styles.bar,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderRadius: navigationRadius.tabBar,
          },
          shadow('large'),
        ]}>
        {state.routes.map((route) => {
          if (!isTabRoute(route.name)) return null;

          const config = TAB_CONFIG[route.name];
          const label = t(config.labelKey);
          const isFocused = route.key === focusedKey;
          const icon = isFocused && config.iconFocused ? config.iconFocused : config.icon;
          const badge = route.name === 'notifications' && unreadCount > 0 ? unreadCount : undefined;
          const iconColor = isFocused ? colors.textInverse : colors.tabIconDefault;
          const labelColor = isFocused ? colors.textInverse : colors.tabIconDefault;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({ type: 'tabLongPress', target: route.key });
          };

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={label}
              onPress={onPress}
              onLongPress={onLongPress}
              hitSlop={4}
              style={({ pressed }) => [styles.tab, { opacity: pressed ? 0.9 : 1 }]}>
              <View
                style={[
                  styles.tabContentWrapper,
                  isFocused && {
                    backgroundColor: colors.primary,
                    borderRadius: navigationRadius.tabCapsule,
                  },
                ]}>
                <TabBarIcon
                  focused={isFocused}
                  color={iconColor}
                  name={icon}
                  badge={badge}
                  plain
                />
                <Text
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.7}
                  style={[
                    typography.caption,
                    styles.label,
                    { color: labelColor },
                    isFocused && styles.labelActive,
                  ]}>
                  {label}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.md,
    backgroundColor: 'transparent',
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 8,
    paddingHorizontal: 4,
    minHeight: 68,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  tabContentWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    maxWidth: '100%',
  },
  label: {
    marginTop: 2,
    textAlign: 'center',
    maxWidth: 72,
  },
  labelActive: {
    fontWeight: '700',
  },
});
