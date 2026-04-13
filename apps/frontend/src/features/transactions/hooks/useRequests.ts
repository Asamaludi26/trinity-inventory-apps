import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { requestApi } from '../api/transactions.api';
import type { RequestFilterParams } from '../types';

const REQUESTS_KEY = ['transactions', 'requests'];

export function useRequests(params?: RequestFilterParams) {
  return useQuery({
    queryKey: [...REQUESTS_KEY, params],
    queryFn: () => requestApi.getAll(params).then((res) => res.data.data),
  });
}

export function useRequest(uuid: string | undefined) {
  return useQuery({
    queryKey: [...REQUESTS_KEY, uuid],
    queryFn: () => requestApi.getById(uuid!).then((res) => res.data.data),
    enabled: !!uuid,
  });
}

export function useCreateRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      requestApi.create(data).then((res) => res.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: REQUESTS_KEY });
    },
  });
}

export function useCancelRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ uuid, version }: { uuid: string; version: number }) =>
      requestApi.cancel(uuid, version),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: REQUESTS_KEY });
    },
  });
}

export function useApproveRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ uuid, version, note }: { uuid: string; version: number; note?: string }) =>
      requestApi.approve(uuid, version, { note }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: REQUESTS_KEY });
    },
  });
}

export function useRejectRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ uuid, version, reason }: { uuid: string; version: number; reason: string }) =>
      requestApi.reject(uuid, version, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: REQUESTS_KEY });
    },
  });
}
