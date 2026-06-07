import {
  DEFAULT_BACKGROUND_PRESET,
  getBackgroundPreset,
  type BackgroundPresetId,
} from '@/lib/background-presets';

export const brand = {
  primary: '#7C3AED',
  primaryLight: '#EDE9FE',
  primaryDark: '#6D28D9',
  accent: '#A78BFA',
} as const;

export type ColorScheme = 'light' | 'dark';

export interface ThemeColors {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  accent: string;
  background: string;
  surface: string;
  surfaceSecondary: string;
  border: string;
  borderStrong: string;
  success: string;
  successSurface: string;
  warning: string;
  warningSurface: string;
  error: string;
  errorSurface: string;
  info: string;
  infoSurface: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;
  tabIconDefault: string;
  tabIconSelected: string;
  shadow: string;
  /** @deprecated use textPrimary */
  text: string;
  /** @deprecated use surface */
  card: string;
  /** @deprecated use primary */
  tint: string;
}

const light: ThemeColors = {
  primary: brand.primary,
  primaryLight: brand.primaryLight,
  primaryDark: brand.primaryDark,
  accent: brand.accent,
  background: '#F9FAFB',
  surface: '#FFFFFF',
  surfaceSecondary: '#F3F4F6',
  border: '#E5E7EB',
  borderStrong: '#D1D5DB',
  success: '#059669',
  successSurface: '#ECFDF5',
  warning: '#D97706',
  warningSurface: '#FFFBEB',
  error: '#DC2626',
  errorSurface: '#FEF2F2',
  info: '#2563EB',
  infoSurface: '#EFF6FF',
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  textInverse: '#FFFFFF',
  tabIconDefault: '#9CA3AF',
  tabIconSelected: brand.primary,
  shadow: brand.primaryDark,
  text: '#111827',
  card: '#FFFFFF',
  tint: brand.primary,
};

const dark: ThemeColors = {
  primary: '#A78BFA',
  primaryLight: '#7C3AED26',
  primaryDark: '#5B21B6',
  accent: brand.accent,
  background: '#0B0F14',
  surface: '#161B26',
  surfaceSecondary: '#1F2937',
  border: '#374151',
  borderStrong: '#4B5563',
  success: '#34D399',
  successSurface: '#0596691F',
  warning: '#FBBF24',
  warningSurface: '#D977061F',
  error: '#F87171',
  errorSurface: '#DC26261F',
  info: '#60A5FA',
  infoSurface: '#2563EB1F',
  textPrimary: '#F9FAFB',
  textSecondary: '#9CA3AF',
  textMuted: '#6B7280',
  textInverse: '#FFFFFF',
  tabIconDefault: '#6B7280',
  tabIconSelected: '#A78BFA',
  shadow: '#000000',
  text: '#F9FAFB',
  card: '#161B26',
  tint: '#A78BFA',
};

export const colors = { light, dark } as const;

export function getColors(scheme: ColorScheme, backgroundPreset: BackgroundPresetId = DEFAULT_BACKGROUND_PRESET): ThemeColors {
  const base = colors[scheme];
  if (backgroundPreset === 'default') return base;

  const preset = getBackgroundPreset(backgroundPreset);
  const overrides = scheme === 'dark' ? preset.dark : preset.light;

  return {
    ...base,
    ...overrides,
    card: overrides.surface ?? base.card,
    text: base.textPrimary,
  };
}

/** 8-digit hex alpha on #RRGGBB brand colors. Amount is 0–255. */
export function primaryAlpha(scheme: ColorScheme, amount: 8 | 12 | 16 | 24 | 32): string {
  const hex = scheme === 'dark' ? '7C3AED' : '7C3AED';
  const alpha = amount.toString(16).padStart(2, '0').toUpperCase();
  return `#${hex}${alpha}`;
}

export default colors;
