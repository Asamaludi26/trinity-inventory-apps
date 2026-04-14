import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationApi } from '../api/notifications.api';
import { useAuthStore } from '@/store/useAuthStore';
import { ENV } from '@/config/env';

const NOTIFICATIONS_KEY = ['notifications'];

export function useNotifications(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: [...NOTIFICATIONS_KEY, params],
    queryFn: () => notificationApi.getAll(params).then((res) => res.data.data),
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: [...NOTIFICATIONS_KEY, 'unread-count'],
    queryFn: () => notificationApi.getUnreadCount().then((res) => res.data.data.count),
    refetchInterval: 60_000,
  });
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => notificationApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
    },
  });
}

export function useMarkAllAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => notificationApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
    },
  });
}

/**
 * SSE listener — automatically invalidates notification queries when new notifications arrive.
 * Should be called once at the app level (e.g. in AppLayout).
 */
export function useNotificationSSE() {
  const token = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!token) return;

    const url = `${ENV.API_BASE_URL}/notifications/stream?token=${encodeURIComponent(token)}`;
    const es = new EventSource(url);

    es.onmessage = () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
    };

    es.onerror = () => {
      es.close();
    };

    return () => {
      es.close();
    };
  }, [token, queryClient]);
}
