import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { brand } from '@/constants/Colors';

interface Props {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  style?: ViewStyle;
}

export function Button({ title, onPress, loading, disabled, variant = 'primary', style }: Props) {
  const bg =
    variant === 'primary' ? brand.primary : variant === 'danger' ? '#D32F2F' : 'transparent';
  const textColor = variant === 'secondary' ? brand.primary : '#fff';
  const borderWidth = variant === 'secondary' ? 1.5 : 0;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.btn,
        {
          backgroundColor: bg,
          borderColor: brand.primary,
          borderWidth,
          opacity: pressed || disabled ? 0.7 : 1,
        },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text style={[styles.text, { color: textColor }]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    alignItems: 'center',
    marginVertical: 6,
  },
  text: { fontSize: 16, fontWeight: '600' },
});
