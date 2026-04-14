import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import type { ApiResponse } from '@/types';
import type { ThresholdAlert } from '../types';

const THRESHOLD_KEY = ['assets', 'threshold-alerts'];

/**
 * Hook for monitoring stock threshold alerts
 * Fetches models that are below minimum quantity threshold
 */
export function useThresholdAlerts() {
  return useQuery({
    queryKey: THRESHOLD_KEY,
    queryFn: async () => {
      // Note: Backend endpoint should be GET /assets/threshold-alerts
      // This fetches all active threshold alerts (below minimum)
      const response = await api.get<ApiResponse<ThresholdAlert[]>>('/assets/threshold-alerts');
      return response.data.data;
    },
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
}

/**
 * Hook to monitor specific model threshold
 */
export function useModelThresholdAlert(modelId?: number) {
  return useQuery({
    queryKey: [...THRESHOLD_KEY, modelId],
    queryFn: async () => {
      if (!modelId) return null;
      const response = await api.get<ApiResponse<ThresholdAlert>>(
        `/assets/models/${modelId}/threshold-alert`,
      );
      return response.data.data;
    },
    enabled: !!modelId,
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
}
