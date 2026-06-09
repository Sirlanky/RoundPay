import type { ColorScheme } from '@/theme/colors';

export interface AdminWalletPalette {
  base: string;
  mid: string;
  glow: string;
  chip: string;
  chipInner: string;
  ink: string;
  inkMuted: string;
  inkFaint: string;
  ring: string;
}

export function adminWalletPalette(scheme: ColorScheme): AdminWalletPalette {
  return scheme === 'dark'
    ? {
        base: '#312E81',
        mid: '#4C1D95',
        glow: '#7C3AED',
        chip: '#FCD34D',
        chipInner: '#F59E0B',
        ink: '#F9FAFB',
        inkMuted: 'rgba(255,255,255,0.72)',
        inkFaint: 'rgba(255,255,255,0.45)',
        ring: 'rgba(255,255,255,0.12)',
      }
    : {
        base: '#4C1D95',
        mid: '#6D28D9',
        glow: '#8B5CF6',
        chip: '#FDE68A',
        chipInner: '#F59E0B',
        ink: '#FFFFFF',
        inkMuted: 'rgba(255,255,255,0.82)',
        inkFaint: 'rgba(255,255,255,0.55)',
        ring: 'rgba(255,255,255,0.18)',
      };
}
