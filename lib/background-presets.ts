import type { ThemeColors } from '@/theme/colors';
import type { TranslationKey } from '@/lib/i18n/keys';

export type BackgroundPresetId = 'default' | 'light' | 'warm' | 'cool' | 'purple';

type BackgroundOverrides = Partial<
  Pick<ThemeColors, 'background' | 'surface' | 'surfaceSecondary' | 'border'>
>;

export interface BackgroundPreset {
  id: BackgroundPresetId;
  labelKey: TranslationKey;
  swatch: string;
  light: BackgroundOverrides;
  dark: BackgroundOverrides;
}

export const BACKGROUND_PRESETS: BackgroundPreset[] = [
  {
    id: 'default',
    labelKey: 'theme.background.default',
    swatch: '#F9FAFB',
    light: {},
    dark: {},
  },
  {
    id: 'light',
    labelKey: 'theme.background.light',
    swatch: '#FFFFFF',
    light: {
      background: '#FFFFFF',
      surface: '#FFFFFF',
      surfaceSecondary: '#F9FAFB',
      border: '#E5E7EB',
    },
    dark: {
      background: '#111827',
      surface: '#1F2937',
      surfaceSecondary: '#374151',
      border: '#4B5563',
    },
  },
  {
    id: 'warm',
    labelKey: 'theme.background.warm',
    swatch: '#FFF7ED',
    light: {
      background: '#FFF7ED',
      surface: '#FFFFFF',
      surfaceSecondary: '#FFEDD5',
      border: '#FED7AA',
    },
    dark: {
      background: '#1C1410',
      surface: '#292018',
      surfaceSecondary: '#3D2E22',
      border: '#5C4535',
    },
  },
  {
    id: 'cool',
    labelKey: 'theme.background.cool',
    swatch: '#F0F9FF',
    light: {
      background: '#F0F9FF',
      surface: '#FFFFFF',
      surfaceSecondary: '#E0F2FE',
      border: '#BAE6FD',
    },
    dark: {
      background: '#0C1220',
      surface: '#111827',
      surfaceSecondary: '#1E293B',
      border: '#334155',
    },
  },
  {
    id: 'purple',
    labelKey: 'theme.background.purple',
    swatch: '#F5F3FF',
    light: {
      background: '#F5F3FF',
      surface: '#FFFFFF',
      surfaceSecondary: '#EDE9FE',
      border: '#DDD6FE',
    },
    dark: {
      background: '#0F0A1A',
      surface: '#1A1228',
      surfaceSecondary: '#2E1F47',
      border: '#4C1D95',
    },
  },
];

export const DEFAULT_BACKGROUND_PRESET: BackgroundPresetId = 'default';

export function isBackgroundPresetId(value: string): value is BackgroundPresetId {
  return BACKGROUND_PRESETS.some((preset) => preset.id === value);
}

export function getBackgroundPreset(id: BackgroundPresetId): BackgroundPreset {
  return BACKGROUND_PRESETS.find((preset) => preset.id === id) ?? BACKGROUND_PRESETS[0];
}
