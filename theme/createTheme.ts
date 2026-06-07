import { DEFAULT_BACKGROUND_PRESET, type BackgroundPresetId } from '@/lib/background-presets';
import { getColors, type ThemeColors } from './colors';
import { spacing, layout } from './spacing';
import { radius, navigationRadius } from './radius';
import { typography } from './typography';
import { getShadow, type ShadowLevel } from './shadows';

export interface DesignTheme {
  scheme: 'light' | 'dark';
  colors: ThemeColors;
  spacing: typeof spacing;
  layout: typeof layout;
  radius: typeof radius;
  navigationRadius: typeof navigationRadius;
  typography: typeof typography;
  shadow: (level: ShadowLevel) => ReturnType<typeof getShadow>;
}

export function createTheme(
  scheme: 'light' | 'dark',
  backgroundPreset: BackgroundPresetId = DEFAULT_BACKGROUND_PRESET
): DesignTheme {
  return {
    scheme,
    colors: getColors(scheme, backgroundPreset),
    spacing,
    layout,
    radius,
    navigationRadius,
    typography,
    shadow: (level) => getShadow(level, scheme),
  };
}
