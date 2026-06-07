import { Image } from 'expo-image';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { PlatformIcon } from '@/components/navigation/PlatformIcon';
import { Text } from '@/components/ui';
import { getProfileInitials } from '@/lib/profile-display';
import type { Profile } from '@/lib/types';
import type { User } from '@supabase/supabase-js';
import { primaryAlpha, useThemeTokens } from '@/theme';

interface Props {
  profile: Profile | null | undefined;
  user?: User | null;
  size?: number;
  editable?: boolean;
  loading?: boolean;
  onPress?: () => void;
}

export function ProfileAvatar({
  profile,
  user,
  size = 64,
  editable = false,
  loading = false,
  onPress,
}: Props) {
  const { colors, scheme, radius } = useThemeTokens();
  const initials = getProfileInitials(profile, profile?.email ?? user?.email);
  const avatarUrl = profile?.avatar_url?.trim();
  const shellStyle = {
    width: size,
    height: size,
    borderRadius: radius.full,
    backgroundColor: primaryAlpha(scheme, 16),
  };

  const content = avatarUrl ? (
    <Image
      source={{ uri: avatarUrl }}
      style={[styles.image, shellStyle]}
      contentFit="cover"
      transition={200}
    />
  ) : (
    <View style={[styles.initialsWrap, shellStyle]}>
      <Text
        variant="headingMedium"
        color="accent"
        style={{ ...styles.initials, fontSize: Math.round(size * 0.34) }}>
        {initials}
      </Text>
    </View>
  );

  const body = (
    <View style={[styles.wrap, { width: size, height: size }]}>
      {content}
      {loading ? (
        <View style={[styles.overlay, shellStyle, { backgroundColor: 'rgba(0,0,0,0.35)' }]}>
          <ActivityIndicator color={colors.textInverse} />
        </View>
      ) : null}
      {editable && !loading ? (
        <View
          style={[
            styles.editBadge,
            {
              backgroundColor: colors.primary,
              borderColor: colors.surface,
            },
          ]}>
          <PlatformIcon
            name={{ ios: 'camera.fill', android: 'photo_camera', web: 'photo_camera' }}
            size={14}
            color={colors.textInverse}
          />
        </View>
      ) : null}
    </View>
  );

  if (!onPress) return body;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Change profile photo"
      onPress={onPress}
      disabled={loading}
      style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}>
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'relative' },
  image: { overflow: 'hidden' },
  initialsWrap: { alignItems: 'center', justifyContent: 'center' },
  initials: { fontWeight: '800' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
