import { StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui';
import { primaryAlpha, useThemeTokens } from '@/theme';

interface Props {
  name: string;
  size?: number;
}

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function InitialsAvatar({ name, size = 40 }: Props) {
  const { scheme } = useThemeTokens();

  return (
    <View
      style={[
        styles.circle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: primaryAlpha(scheme, 12),
        },
      ]}>
      <Text variant="bodySmall" color="accent" style={{ fontWeight: '800', fontSize: size * 0.36 }}>
        {initialsFromName(name)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: { alignItems: 'center', justifyContent: 'center' },
});
