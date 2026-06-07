import React, { createContext, useContext } from 'react';
import { useNotificationsState, type NotificationsState } from '@/hooks/useNotificationsState';

const NotificationsContext = createContext<NotificationsState | null>(null);

export function NotificationsProvider({
  userId,
  children,
}: {
  userId: string | undefined;
  children: React.ReactNode;
}) {
  const value = useNotificationsState(userId);
  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotificationsContext(): NotificationsState {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    throw new Error('useNotificationsContext must be used within NotificationsProvider');
  }
  return ctx;
}

/** Unread count for the tab badge — shared with the Alerts screen. */
export function useNotificationUnreadCount(): number {
  const ctx = useContext(NotificationsContext);
  return ctx?.unreadCount ?? 0;
}
