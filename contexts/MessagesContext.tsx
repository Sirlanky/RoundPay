import React, { createContext, useCallback, useContext } from 'react';
import { useContactLabels } from '@/hooks/useContactLabels';
import { useConversations } from '@/hooks/useConversations';
import type { Conversation } from '@/lib/messages';

interface MessagesState {
  conversations: Conversation[];
  loading: boolean;
  labelsLoading: boolean;
  unreadTotal: number;
  labels: Record<string, string>;
  refetch: () => Promise<void>;
  setContactLabel: (contactId: string, label: string) => Promise<void>;
  removeContactLabel: (contactId: string) => Promise<void>;
}

const MessagesContext = createContext<MessagesState | null>(null);

export function MessagesProvider({
  userId,
  children,
}: {
  userId: string | undefined;
  children: React.ReactNode;
}) {
  const { conversations, loading, unreadTotal, refetch: refetchConversations } = useConversations(userId);
  const {
    labels,
    loading: labelsLoading,
    refetch: refetchLabels,
    setLabel,
    removeLabel,
  } = useContactLabels(userId);

  const refetch = useCallback(async () => {
    await Promise.all([refetchConversations(), refetchLabels()]);
  }, [refetchConversations, refetchLabels]);

  return (
    <MessagesContext.Provider
      value={{
        conversations,
        loading,
        labelsLoading,
        unreadTotal,
        labels,
        refetch,
        setContactLabel: setLabel,
        removeContactLabel: removeLabel,
      }}>
      {children}
    </MessagesContext.Provider>
  );
}

export function useMessagesContext(): MessagesState {
  const ctx = useContext(MessagesContext);
  if (!ctx) {
    throw new Error('useMessagesContext must be used within MessagesProvider');
  }
  return ctx;
}

/** Unread count for tab badges and shortcuts. */
export function useMessagesUnreadCount(): number {
  const ctx = useContext(MessagesContext);
  return ctx?.unreadTotal ?? 0;
}
