import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui';
import { primaryAlpha, useThemeTokens } from '@/theme';

interface Props {
  name: string;
  uri?: string | null;
  size?: number;
}

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Shows a member's uploaded profile photo when available, falling back to their
 * initials. Used anywhere we render other people (ledger, payouts, member lists).
 */
export function Avatar({ name, uri, size = 40 }: Props) {
  const { scheme } = useThemeTokens();
  const photo = uri?.trim();
  const shellStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: primaryAlpha(scheme, 12),
  };

  if (photo) {
    return (
      <Image
        source={{ uri: photo }}
        style={[styles.image, shellStyle]}
        contentFit="cover"
        transition={150}
        cachePolicy="memory-disk"
      />
    );
  }

  return (
    <View style={[styles.circle, shellStyle]}>
      <Text variant="bodySmall" color="accent" style={{ fontWeight: '800', fontSize: size * 0.36 }}>
        {initialsFromName(name)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: { alignItems: 'center', justifyContent: 'center' },
  image: { overflow: 'hidden' },
});
