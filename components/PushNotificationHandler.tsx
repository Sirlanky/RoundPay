import * as Notifications from 'expo-notifications';
import { useRouter, type Href } from 'expo-router';
import { useEffect } from 'react';
import {
  getNotificationPathFromPushData,
  markNotificationRead,
} from '@/lib/in-app-notifications';
import { parsePushNotificationData } from '@/lib/notifications';

export function PushNotificationHandler() {
  const router = useRouter();

  useEffect(() => {
    const handleResponse = (response: Notifications.NotificationResponse) => {
      try {
        const raw = response.notification.request.content.data as
          | Record<string, unknown>
          | undefined;
        const data = parsePushNotificationData(raw);
        const path = getNotificationPathFromPushData({
          ...raw,
          type: data.type,
          groupId: data.groupId,
          relatedEntityId: data.relatedEntityId,
          notificationId: data.notificationId,
        });

        if (path) {
          router.push(path as Href);
        }

        if (data.notificationId) {
          void markNotificationRead(data.notificationId);
        }
      } catch {
        // Navigation may fail before the router is ready — ignore.
      }
    };

    const last = Notifications.getLastNotificationResponse();
    if (last) {
      const timer = setTimeout(() => handleResponse(last), 600);
      const sub = Notifications.addNotificationResponseReceivedListener(handleResponse);
      return () => {
        clearTimeout(timer);
        sub.remove();
      };
    }

    const sub = Notifications.addNotificationResponseReceivedListener(handleResponse);
    return () => sub.remove();
  }, [router]);

  return null;
}
