import { getColors, type ThemeColors } from '@/theme/colors';
import { DEFAULT_BACKGROUND_PRESET, type BackgroundPresetId } from './background-presets';

let palettes: { light: ThemeColors; dark: ThemeColors } = {
  light: getColors('light', DEFAULT_BACKGROUND_PRESET),
  dark: getColors('dark', DEFAULT_BACKGROUND_PRESET),
};

export function syncAppColorPalettes(preset: BackgroundPresetId = DEFAULT_BACKGROUND_PRESET): void {
  palettes = {
    light: getColors('light', preset),
    dark: getColors('dark', preset),
  };
}

export function getAppColors(scheme: 'light' | 'dark'): ThemeColors {
  return palettes[scheme];
}
