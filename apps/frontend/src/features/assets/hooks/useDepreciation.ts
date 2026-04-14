import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { depreciationApi } from '../api/assets.api';
import type { DepreciationFilterParams } from '../types';

const DEPRECIATION_KEY = ['assets', 'depreciation'];

export function useDepreciations(params?: DepreciationFilterParams) {
  return useQuery({
    queryKey: [...DEPRECIATION_KEY, params],
    queryFn: () => depreciationApi.getAll(params).then((res) => res.data.data),
  });
}

export function useDepreciation(uuid: string | undefined) {
  return useQuery({
    queryKey: [...DEPRECIATION_KEY, uuid],
    queryFn: () => depreciationApi.getById(uuid!).then((res) => res.data.data),
    enabled: !!uuid,
  });
}

/**
 * Get depreciation schedule for a specific depreciation record
 */
export function useDepreciationSchedule(uuid: string | undefined) {
  return useQuery({
    queryKey: [...DEPRECIATION_KEY, 'schedule', uuid],
    queryFn: () => depreciationApi.getSchedule(uuid!).then((res) => res.data.data),
    enabled: !!uuid,
  });
}

/**
 * Get current depreciation status (value, completed months, etc.)
 */
export function useDepreciationStatus(uuid: string | undefined) {
  return useQuery({
    queryKey: [...DEPRECIATION_KEY, 'status', uuid],
    queryFn: () => depreciationApi.getStatus(uuid!).then((res) => res.data.data),
    enabled: !!uuid,
  });
}

export function useCreateDepreciation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      depreciationApi.create(data).then((res) => res.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DEPRECIATION_KEY });
    },
  });
}

export function useDeleteDepreciation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (uuid: string) => depreciationApi.remove(uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DEPRECIATION_KEY });
    },
  });
}
