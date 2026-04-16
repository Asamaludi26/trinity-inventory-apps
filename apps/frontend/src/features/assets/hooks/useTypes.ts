import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { typeApi } from '../api/assets.api';
import type { AssetClassification, TrackingMethod } from '../types';

const TYPES_KEY = ['assets', 'types'];

export function useTypes(categoryId?: number) {
  return useQuery({
    queryKey: [...TYPES_KEY, categoryId],
    queryFn: () => typeApi.getAll(categoryId).then((res) => res.data.data.data),
  });
}

export function useCreateType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      categoryId: number;
      name: string;
      classification?: AssetClassification;
      trackingMethod?: TrackingMethod;
      unitOfMeasure?: string;
    }) => typeApi.create(data).then((res) => res.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TYPES_KEY });
    },
  });
}

export function useUpdateType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: {
        name?: string;
        classification?: AssetClassification | null;
        trackingMethod?: TrackingMethod | null;
        unitOfMeasure?: string | null;
      };
    }) => typeApi.update(id, data).then((res) => res.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TYPES_KEY });
    },
  });
}

export function useDeleteType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => typeApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TYPES_KEY });
    },
  });
}
