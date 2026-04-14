import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ENV } from '@/config/env';
import { useAuthStore } from '@/store/useAuthStore';

interface TransactionEvent {
  id: string;
  code: string;
  type: 'request' | 'loan' | 'return' | 'handover' | 'repair';
  status: string;
  version: number;
  updatedAt: string;
}

const EVENT_TYPE_TO_QUERY_KEY: Record<string, string[]> = {
  request: ['transactions', 'requests'],
  loan: ['transactions', 'loans'],
  return: ['transactions', 'returns'],
  handover: ['transactions', 'handovers'],
  repair: ['transactions', 'repairs'],
};

/**
 * Hook to subscribe to SSE stream for real-time transaction updates.
 * Auto-reconnects on connection loss. Invalidates React Query cache
 * when a transaction_updated event is received.
 */
export function useSSE() {
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((s) => s.accessToken);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (!accessToken) return;

    let isMounted = true;

    function connect() {
      if (!isMounted) return;

      const url = `${ENV.API_BASE_URL}/events/stream?token=${encodeURIComponent(accessToken!)}`;
      const es = new EventSource(url);
      eventSourceRef.current = es;

      es.addEventListener('transaction_updated', (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data) as TransactionEvent;
          const queryKey = EVENT_TYPE_TO_QUERY_KEY[data.type];
          if (queryKey) {
            queryClient.invalidateQueries({ queryKey });
          }
          // Also refresh notifications
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
        } catch {
          // Ignore malformed events
        }
      });

      es.onerror = () => {
        es.close();
        eventSourceRef.current = null;

        // Reconnect after 5 seconds
        if (isMounted) {
          reconnectTimeoutRef.current = setTimeout(connect, 5000);
        }
      };
    }

    connect();

    return () => {
      isMounted = false;
      eventSourceRef.current?.close();
      eventSourceRef.current = null;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [accessToken, queryClient]);
}
