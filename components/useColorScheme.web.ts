import { useContext } from 'react';
import { ThemeContext } from '@/contexts/ThemeContext';

export function useColorScheme(): 'light' | 'dark' {
  const theme = useContext(ThemeContext);
  return theme?.colorScheme ?? 'light';
}
