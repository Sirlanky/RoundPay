import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Linking, Platform } from 'react-native';
import { supabase } from './supabase';
import type { NotificationType } from './types';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export type PushPermissionStatus = 'granted' | 'denied' | 'undetermined' | 'unsupported';

export type PushRegistrationErrorCode =
  | 'unsupported'
  | 'no_user'
  | 'permission_denied'
  | 'no_project_id'
  | 'token_error'
  | 'db_error';

export class PushRegistrationError extends Error {
  code: PushRegistrationErrorCode;

  constructor(code: PushRegistrationErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

export interface PushNotificationData {
  type?: NotificationType | string;
  groupId?: string;
  group_id?: string;
  relatedEntityId?: string;
  related_entity_id?: string;
  notificationId?: string;
}

export function isPushEnabledColumnMissing(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const e = error as { message?: string; code?: string };
  return e.code === 'PGRST204' || (e.message?.includes('push_enabled') ?? false);
}

function getExpoProjectId(): string | undefined {
  const fromConfig =
    Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  const fromEnv = process.env.EXPO_PUBLIC_EAS_PROJECT_ID;
  return fromConfig || fromEnv || undefined;
}

export async function getPushPermissionStatus(): Promise<PushPermissionStatus> {
  if (!Device.isDevice) return 'unsupported';
  const { status } = await Notifications.getPermissionsAsync();
  if (status === 'granted') return 'granted';
  if (status === 'denied') return 'denied';
  return 'undetermined';
}

export async function openNotificationSettings(): Promise<void> {
  await Linking.openSettings();
}

async function savePushToken(userId: string, token: string): Promise<void> {
  const withPrefs = await supabase
    .from('profiles')
    .update({ expo_push_token: token, push_enabled: true })
    .eq('id', userId);

  if (withPrefs.error && isPushEnabledColumnMissing(withPrefs.error)) {
    const fallback = await supabase
      .from('profiles')
      .update({ expo_push_token: token })
      .eq('id', userId);
    if (fallback.error) {
      throw new PushRegistrationError('db_error', fallback.error.message);
    }
    return;
  }

  if (withPrefs.error) {
    throw new PushRegistrationError('db_error', withPrefs.error.message);
  }
}

export async function registerForPushNotifications(options?: {
  force?: boolean;
}): Promise<string> {
  if (!Device.isDevice) {
    throw new PushRegistrationError('unsupported', 'Push requires a physical device.');
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new PushRegistrationError('no_user', 'Sign in to enable push notifications.');
  }

  if (!options?.force) {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('push_enabled')
      .eq('id', user.id)
      .single();
    if (!error && profile?.push_enabled === false) {
      throw new PushRegistrationError('permission_denied', 'Push notifications are turned off.');
    }
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    throw new PushRegistrationError('permission_denied', 'Notification permission was not granted.');
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Ajo Esusu',
      importance: Notifications.AndroidImportance.MAX,
    });
  }

  const projectId = getExpoProjectId();
  if (!projectId) {
    throw new PushRegistrationError(
      'no_project_id',
      'No EAS project ID configured. Set EXPO_PUBLIC_EAS_PROJECT_ID in .env or run npx eas init.'
    );
  }

  let token: string;
  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    token = tokenData.data;
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Could not get push token.';
    throw new PushRegistrationError('token_error', message);
  }

  await savePushToken(user.id, token);
  return token;
}

export async function disablePushNotifications(): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const withPrefs = await supabase
    .from('profiles')
    .update({ expo_push_token: null, push_enabled: false })
    .eq('id', user.id);

  if (withPrefs.error && isPushEnabledColumnMissing(withPrefs.error)) {
    await supabase.from('profiles').update({ expo_push_token: null }).eq('id', user.id);
  }
}

export async function clearPushTokenOnSignOut(userId: string): Promise<void> {
  await supabase.from('profiles').update({ expo_push_token: null }).eq('id', userId);
}

export function parsePushNotificationData(
  data: Record<string, unknown> | undefined
): PushNotificationData {
  if (!data) return {};
  return {
    type: (data.type as NotificationType | string | undefined) ?? undefined,
    groupId: (data.groupId as string | undefined) ?? (data.group_id as string | undefined),
    relatedEntityId:
      (data.relatedEntityId as string | undefined) ??
      (data.related_entity_id as string | undefined),
    notificationId: (data.notificationId as string | undefined) ?? undefined,
  };
}
