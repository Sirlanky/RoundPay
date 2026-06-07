export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
} as const;

export type SpacingKey = keyof typeof spacing;

export const layout = {
  screenPaddingX: spacing.lg,
  cardPadding: spacing.md,
  buttonPaddingY: 14,
  inputPaddingY: 12,
  minTouchTarget: 44,
} as const;
