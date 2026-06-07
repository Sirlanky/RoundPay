import type { TranslationKey } from '@/lib/i18n/keys';

export type TabRouteName = 'index' | 'groups' | 'contributions' | 'notifications' | 'profile';

type IconName = { ios: string; android: string; web: string };

export interface TabConfig {
  labelKey: TranslationKey;
  icon: IconName;
  iconFocused?: IconName;
}

export const TAB_CONFIG: Record<TabRouteName, TabConfig> = {
  index: {
    labelKey: 'nav.home',
    icon: { ios: 'house', android: 'home', web: 'home' },
    iconFocused: { ios: 'house.fill', android: 'home', web: 'home' },
  },
  groups: {
    labelKey: 'nav.groups',
    icon: { ios: 'person.3', android: 'group', web: 'group' },
    iconFocused: { ios: 'person.3.fill', android: 'group', web: 'group' },
  },
  contributions: {
    labelKey: 'nav.contributions',
    icon: { ios: 'banknote', android: 'payments', web: 'payments' },
    iconFocused: { ios: 'banknote.fill', android: 'payments', web: 'payments' },
  },
  notifications: {
    labelKey: 'nav.alerts',
    icon: { ios: 'bell', android: 'notifications', web: 'notifications' },
    iconFocused: { ios: 'bell.fill', android: 'notifications', web: 'notifications' },
  },
  profile: {
    labelKey: 'nav.profile',
    icon: { ios: 'person.circle', android: 'person', web: 'person' },
    iconFocused: { ios: 'person.circle.fill', android: 'person', web: 'person' },
  },
};
