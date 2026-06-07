import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance, type ColorSchemeName } from 'react-native';
import { syncAppColorPalettes } from '@/lib/app-colors-bridge';
import { DEFAULT_BACKGROUND_PRESET, type BackgroundPresetId } from '@/lib/background-presets';
import { loadBackgroundPreset, saveBackgroundPreset } from '@/lib/background-preference';
import { resolveColorScheme, type ThemePreference } from '@/lib/theme';
import { loadPreferredTheme, savePreferredTheme } from '@/lib/theme-preference';

interface ThemeContextValue {
  preference: ThemePreference;
  backgroundPreset: BackgroundPresetId;
  colorScheme: 'light' | 'dark';
  loading: boolean;
  setPreference: (preference: ThemePreference) => Promise<void>;
  setBackgroundPreset: (preset: BackgroundPresetId) => Promise<void>;
}

export const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function readSystemScheme(scheme: ColorSchemeName | null | undefined): 'light' | 'dark' {
  return scheme === 'dark' ? 'dark' : 'light';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>('system');
  const [backgroundPreset, setBackgroundPresetState] = useState<BackgroundPresetId>(
    DEFAULT_BACKGROUND_PRESET
  );
  const [systemScheme, setSystemScheme] = useState<'light' | 'dark'>(() =>
    readSystemScheme(Appearance.getColorScheme())
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void Promise.all([loadPreferredTheme(), loadBackgroundPreset()]).then(([theme, background]) => {
      setPreferenceState(theme);
      setBackgroundPresetState(background);
      syncAppColorPalettes(background);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    syncAppColorPalettes(backgroundPreset);
  }, [backgroundPreset]);

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemScheme(readSystemScheme(colorScheme));
    });
    return () => subscription.remove();
  }, []);

  const setPreference = async (value: ThemePreference) => {
    setPreferenceState(value);
    await savePreferredTheme(value);
  };

  const setBackgroundPreset = async (value: BackgroundPresetId) => {
    setBackgroundPresetState(value);
    syncAppColorPalettes(value);
    await saveBackgroundPreset(value);
  };

  const colorScheme = resolveColorScheme(preference, systemScheme);

  const contextValue = useMemo(
    () => ({
      preference,
      backgroundPreset,
      colorScheme,
      loading,
      setPreference,
      setBackgroundPreset,
    }),
    [preference, backgroundPreset, colorScheme, loading]
  );

  return <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
