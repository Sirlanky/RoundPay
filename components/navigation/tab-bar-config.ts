import type { TranslationKey } from '@/lib/i18n/keys';

export type MemberTabRouteName =
  | 'index'
  | 'groups'
  | 'contributions'
  | 'notifications'
  | 'profile';

export type AdminTabRouteName = 'dashboard' | 'groups' | 'ledger' | 'payouts' | 'more';

export type TabRouteName = MemberTabRouteName | AdminTabRouteName;

type IconName = { ios: string; android: string; web: string };

export interface TabConfig {
  labelKey: TranslationKey;
  icon: IconName;
  iconFocused?: IconName;
}

export const MEMBER_TAB_CONFIG: Record<MemberTabRouteName, TabConfig> = {
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

export const ADMIN_TAB_CONFIG: Record<AdminTabRouteName, TabConfig> = {
  dashboard: {
    labelKey: 'nav.dashboard',
    icon: { ios: 'chart.bar', android: 'dashboard', web: 'dashboard' },
    iconFocused: { ios: 'chart.bar.fill', android: 'dashboard', web: 'dashboard' },
  },
  groups: {
    labelKey: 'nav.groups',
    icon: { ios: 'person.3', android: 'group', web: 'group' },
    iconFocused: { ios: 'person.3.fill', android: 'group', web: 'group' },
  },
  ledger: {
    labelKey: 'nav.ledger',
    icon: { ios: 'list.bullet.rectangle', android: 'receipt_long', web: 'receipt_long' },
    iconFocused: {
      ios: 'list.bullet.rectangle.fill',
      android: 'receipt_long',
      web: 'receipt_long',
    },
  },
  payouts: {
    labelKey: 'nav.payouts',
    icon: { ios: 'arrow.up.circle', android: 'north', web: 'north' },
    iconFocused: { ios: 'arrow.up.circle.fill', android: 'north', web: 'north' },
  },
  more: {
    labelKey: 'nav.more',
    icon: { ios: 'ellipsis.circle', android: 'more_horiz', web: 'more_horiz' },
    iconFocused: { ios: 'ellipsis.circle.fill', android: 'more_horiz', web: 'more_horiz' },
  },
};

/** @deprecated Use MEMBER_TAB_CONFIG */
export const TAB_CONFIG = MEMBER_TAB_CONFIG;

export function getActiveTabConfig(mode: 'admin' | 'member'): Record<string, TabConfig> {
  return mode === 'admin' ? ADMIN_TAB_CONFIG : MEMBER_TAB_CONFIG;
}

export function isTabInConfig(name: string, mode: 'admin' | 'member'): boolean {
  return name in getActiveTabConfig(mode);
}
