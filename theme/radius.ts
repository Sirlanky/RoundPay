export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
} as const;

export type RadiusKey = keyof typeof radius;

/** Floating bottom tab bar outer pill — navigation-specific. */
export const navigationRadius = {
  tabBar: 28,
  tabCapsule: 20,
} as const;
