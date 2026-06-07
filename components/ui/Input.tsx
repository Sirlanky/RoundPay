import { SymbolView } from 'expo-symbols';
import { StyleSheet, TextInput, TextInputProps, View, ViewStyle } from 'react-native';
import { useThemeTokens } from '@/theme';
import { Text } from './Text';

export type InputVariant = 'text' | 'search' | 'number';

interface Props extends TextInputProps {
  label?: string;
  error?: string;
  variant?: InputVariant;
  containerStyle?: ViewStyle;
}

export function Input({
  label,
  error,
  variant = 'text',
  containerStyle,
  style,
  ...props
}: Props) {
  const theme = useThemeTokens();
  const { colors, radius, typography, spacing } = theme;
  const isSearch = variant === 'search';

  return (
    <View style={[styles.wrap, { marginBottom: spacing.sm + 4 }, containerStyle]}>
      {label ? (
        <Text variant="bodySmall" color="primary" style={styles.label}>
          {label}
        </Text>
      ) : null}
      <View
        style={[
          styles.fieldRow,
          {
            backgroundColor: isSearch ? colors.surfaceSecondary : colors.surface,
            borderColor: error ? colors.error : colors.border,
            borderRadius: radius.md,
          },
        ]}>
        {isSearch ? (
          <SymbolView
            name={{ ios: 'magnifyingglass', android: 'search', web: 'search' } as never}
            tintColor={colors.textMuted}
            size={18}
          />
        ) : null}
        <TextInput
          placeholderTextColor={colors.textMuted}
          keyboardType={variant === 'number' ? 'decimal-pad' : props.keyboardType}
          style={[
            typography.bodyLarge,
            styles.input,
            { color: colors.textPrimary, flex: 1 },
            isSearch && styles.searchInput,
            style,
          ]}
          {...props}
        />
      </View>
      {error ? (
        <Text variant="caption" color="error" style={styles.error}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {},
  label: {
    fontWeight: '500',
    marginBottom: 6,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 14,
    minHeight: 48,
  },
  input: {
    paddingVertical: 12,
    paddingHorizontal: 0,
  },
  searchInput: {
    paddingLeft: 8,
  },
  error: {
    marginTop: 4,
  },
});
