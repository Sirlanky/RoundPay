export type ThemePreference = 'system' | 'light' | 'dark';

export const DEFAULT_THEME: ThemePreference = 'system';

export interface ThemeOption {
  value: ThemePreference;
  icon: { ios: string; android: string; web: string };
}

export const THEME_OPTIONS: ThemeOption[] = [
  {
    value: 'system',
    icon: { ios: 'circle.lefthalf.filled', android: 'brightness_auto', web: 'brightness_auto' },
  },
  {
    value: 'light',
    icon: { ios: 'sun.max.fill', android: 'light_mode', web: 'light_mode' },
  },
  {
    value: 'dark',
    icon: { ios: 'moon.fill', android: 'dark_mode', web: 'dark_mode' },
  },
];

export function isThemePreference(value: string): value is ThemePreference {
  return value === 'system' || value === 'light' || value === 'dark';
}

export function resolveColorScheme(
  preference: ThemePreference,
  systemScheme: 'light' | 'dark' | null | undefined
): 'light' | 'dark' {
  if (preference === 'light') return 'light';
  if (preference === 'dark') return 'dark';
  return systemScheme === 'dark' ? 'dark' : 'light';
}
