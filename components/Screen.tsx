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
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '@/constants/Colors';
import { spacing } from '@/constants/theme';
import { useColorScheme } from './useColorScheme';

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
}: Props) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  const inner = scroll ? (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={[styles.scrollContent, contentStyle]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={colors.tint} />
        ) : undefined
      }>
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.flex, styles.scrollContent, contentStyle]}>{children}</View>
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
    <SafeAreaView style={[styles.flex, { backgroundColor: colors.background }]} edges={edges}>
      {body}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
});
