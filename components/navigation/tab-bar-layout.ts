/** Visual height of the floating pill (excludes home-indicator inset). */
export const TAB_BAR_PILL_HEIGHT = 76;

/** Gap between pill bottom and home-indicator area. */
export const TAB_BAR_FLOAT_GAP = 6;

export function floatingTabBarClearance(bottomInset: number): number {
  return TAB_BAR_PILL_HEIGHT + TAB_BAR_FLOAT_GAP + bottomInset;
}
