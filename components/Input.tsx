import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import Colors from '@/constants/Colors';
import { useColorScheme } from './useColorScheme';

interface Props extends TextInputProps {
  label?: string;
  error?: string;
}

export function Input({ label, error, style, ...props }: Props) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  return (
    <View style={styles.wrap}>
      {label ? <Text style={[styles.label, { color: colors.text }]}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={colors.textSecondary}
        style={[
          styles.input,
          {
            color: colors.text,
            backgroundColor: colors.card,
            borderColor: error ? colors.error : colors.border,
          },
          style,
        ]}
        {...props}
      />
      {error ? <Text style={[styles.error, { color: colors.error }]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 12 },
  label: { fontSize: 14, fontWeight: '500', marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  error: { fontSize: 12, marginTop: 4 },
});
