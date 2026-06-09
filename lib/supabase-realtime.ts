import type { RealtimeChannel } from '@supabase/supabase-js';
import { useCallback, useRef } from 'react';
import { supabase } from './supabase';

type PostgresChangeConfig = {
  event: '*' | 'INSERT' | 'UPDATE' | 'DELETE';
  schema: string;
  table: string;
  filter?: string;
};

function removeChannelByTopic(topic: string): void {
  for (const channel of supabase.getChannels()) {
    if (channel.topic === `realtime:${topic}`) {
      supabase.removeChannel(channel);
    }
  }
}

/** Subscribe once per topic; removes any stale channel first to avoid "after subscribe()" errors. */
export function subscribePostgresChannel(
  topic: string,
  bindings: Array<{ config: PostgresChangeConfig; callback: () => void }>
): RealtimeChannel {
  removeChannelByTopic(topic);

  let channel = supabase.channel(topic);
  for (const { config, callback } of bindings) {
    channel = channel.on('postgres_changes', config as never, callback);
  }
  channel.subscribe();
  return channel;
}

export function unsubscribePostgresChannel(channel: RealtimeChannel): void {
  supabase.removeChannel(channel);
}

/** Stable handler for realtime — keeps subscription deps from changing when fetch/load updates. */
export function useRealtimeHandler(handler: () => void): () => void {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;
  return useCallback(() => {
    handlerRef.current();
  }, []);
}
