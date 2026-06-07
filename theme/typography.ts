import { TextStyle } from 'react-native';

export const fontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};

export const typography = {
  display: {
    fontSize: 32,
    fontWeight: fontWeight.extrabold,
    lineHeight: 38,
  },
  headingLarge: {
    fontSize: 24,
    fontWeight: fontWeight.bold,
    lineHeight: 30,
  },
  headingMedium: {
    fontSize: 20,
    fontWeight: fontWeight.bold,
    lineHeight: 26,
  },
  headingSmall: {
    fontSize: 17,
    fontWeight: fontWeight.bold,
    lineHeight: 22,
  },
  bodyLarge: {
    fontSize: 16,
    fontWeight: fontWeight.regular,
    lineHeight: 24,
  },
  bodyMedium: {
    fontSize: 15,
    fontWeight: fontWeight.regular,
    lineHeight: 22,
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: fontWeight.regular,
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    fontWeight: fontWeight.medium,
    lineHeight: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: fontWeight.semibold,
    lineHeight: 18,
    letterSpacing: 0.3,
    textTransform: 'uppercase' as const,
  },
  money: {
    fontSize: 28,
    fontWeight: fontWeight.extrabold,
    lineHeight: 34,
  },
} as const satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof typography;

/** @deprecated legacy names — map to new scale */
export const legacyTypography = {
  hero: typography.display,
  title: typography.headingLarge,
  heading: typography.headingSmall,
  body: typography.bodyLarge,
  caption: typography.bodySmall,
  label: typography.bodySmall,
};
