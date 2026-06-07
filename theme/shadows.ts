import { Platform, ViewStyle } from 'react-native';
import type { ColorScheme } from './colors';

export type ShadowLevel = 'small' | 'medium' | 'large';

const iosShadows: Record<ShadowLevel, ViewStyle> = {
  small: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  medium: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  large: {
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
  },
};

const androidElevation: Record<ShadowLevel, number> = {
  small: 2,
  medium: 4,
  large: 8,
};

export function getShadow(level: ShadowLevel, scheme: ColorScheme): ViewStyle {
  const shadowColor = scheme === 'dark' ? '#000000' : '#6D28D9';

  return Platform.select({
    ios: { ...iosShadows[level], shadowColor },
    android: { elevation: androidElevation[level] },
    default: {},
  }) as ViewStyle;
}
