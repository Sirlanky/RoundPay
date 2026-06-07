import { useContext } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';
import { ThemeContext } from '@/contexts/ThemeContext';

export function useColorScheme(): 'light' | 'dark' {
  const theme = useContext(ThemeContext);
  if (theme) return theme.colorScheme;

  const coreScheme = useRNColorScheme();
  return coreScheme === 'dark' ? 'dark' : 'light';
}
