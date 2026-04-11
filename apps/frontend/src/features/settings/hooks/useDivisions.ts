import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { divisionsApi } from '../api';
import type {
  CreateDivisionFormData,
  UpdateDivisionFormData,
} from '../../../validation/settings.schema';
import type { PaginationParams } from '../../../types';

const DIVISIONS_KEY = ['settings', 'divisions'];

export function useDivisions(params?: PaginationParams) {
  return useQuery({
    queryKey: [...DIVISIONS_KEY, params],
    queryFn: () => divisionsApi.getAll(params).then((res) => res.data.data),
  });
}

export function useDivision(uuid: string | undefined) {
  return useQuery({
    queryKey: [...DIVISIONS_KEY, uuid],
    queryFn: () => divisionsApi.getByUuid(uuid!).then((res) => res.data.data),
    enabled: !!uuid,
  });
}

export function useActiveDivisions() {
  return useQuery({
    queryKey: [...DIVISIONS_KEY, 'active'],
    queryFn: () => divisionsApi.getActive().then((res) => res.data.data),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateDivision() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateDivisionFormData) =>
      divisionsApi.create(data).then((res) => res.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DIVISIONS_KEY });
    },
  });
}

export function useUpdateDivision() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ uuid, data }: { uuid: string; data: UpdateDivisionFormData }) =>
      divisionsApi.update(uuid, data).then((res) => res.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DIVISIONS_KEY });
    },
  });
}

export function useDeleteDivision() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (uuid: string) => divisionsApi.delete(uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DIVISIONS_KEY });
    },
  });
}
