import { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { floatingTabBarClearance } from '@/components/navigation/tab-bar-layout';
import { layout, spacing, useThemeTokens } from '@/theme';

interface Props {
  children: ReactNode;
  scroll?: boolean;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  keyboard?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  safeArea?: boolean;
  avoidTopInset?: boolean;
  tabBarInset?: boolean;
}

export function Screen({
  children,
  scroll = true,
  edges = ['top', 'bottom'],
  keyboard = false,
  refreshing,
  onRefresh,
  style,
  contentStyle,
  safeArea = true,
  avoidTopInset = false,
  tabBarInset = false,
}: Props) {
  const theme = useThemeTokens();
  const { colors } = theme;
  const insets = useSafeAreaInsets();
  const safeEdges =
    safeArea && avoidTopInset ? (['bottom', 'left', 'right'] as const) : edges;
  const tabBarPadding = tabBarInset
    ? { paddingBottom: Math.max(spacing.xl, floatingTabBarClearance(insets.bottom)) }
    : undefined;

  const inner = scroll ? (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={[styles.scrollContent, contentStyle, tabBarPadding]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        ) : undefined
      }>
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.flex, styles.scrollContent, contentStyle, tabBarPadding]}>{children}</View>
  );

  const body = keyboard ? (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.background }, style]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {inner}
    </KeyboardAvoidingView>
  ) : (
    <View style={[styles.flex, { backgroundColor: colors.background }, style]}>{inner}</View>
  );

  if (!safeArea) return body;

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: colors.background }]} edges={safeEdges}>
      {body}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: {
    paddingHorizontal: layout.screenPaddingX,
    paddingBottom: spacing.xl,
  },
});
