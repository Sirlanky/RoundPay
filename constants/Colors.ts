/**
 * @deprecated Import from `@/theme` instead.
 * Kept for legacy screens — reads live palettes from ThemeContext via app-colors-bridge.
 */
import { brand, colors, getColors } from '@/theme/colors';
import { getAppColors } from '@/lib/app-colors-bridge';

export { brand, getColors };

const Colors = {
  get light() {
    return getAppColors('light');
  },
  get dark() {
    return getAppColors('dark');
  },
};

export default Colors;
export { colors };
