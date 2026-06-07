import { useContext } from 'react';
import { useColorScheme } from '@/components/useColorScheme';
import { ThemeContext } from '@/contexts/ThemeContext';
import { DEFAULT_BACKGROUND_PRESET } from '@/lib/background-presets';
import { createTheme } from './createTheme';

/** Resolved design tokens for the active color scheme and background preset. */
export function useThemeTokens() {
  const scheme = useColorScheme() ?? 'light';
  const theme = useContext(ThemeContext);
  const backgroundPreset = theme?.backgroundPreset ?? DEFAULT_BACKGROUND_PRESET;
  return createTheme(scheme, backgroundPreset);
}
