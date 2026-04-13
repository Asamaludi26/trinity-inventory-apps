import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { assetApi } from '../api/assets.api';
import type { AssetFilterParams } from '../types';

const ASSETS_KEY = ['assets'];

export function useAssets(params?: AssetFilterParams) {
  return useQuery({
    queryKey: [...ASSETS_KEY, params],
    queryFn: () => assetApi.getAll(params).then((res) => res.data.data),
  });
}

export function useAsset(id: string | undefined) {
  return useQuery({
    queryKey: [...ASSETS_KEY, id],
    queryFn: () => assetApi.getById(id!).then((res) => res.data.data),
    enabled: !!id,
  });
}

export function useCreateAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      assetApi.create(data).then((res) => res.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ASSETS_KEY });
    },
  });
}

export function useUpdateAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      version,
      data,
    }: {
      id: string;
      version: number;
      data: Record<string, unknown>;
    }) => assetApi.update(id, version, data).then((res) => res.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ASSETS_KEY });
    },
  });
}

export function useDeleteAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => assetApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ASSETS_KEY });
    },
  });
}
