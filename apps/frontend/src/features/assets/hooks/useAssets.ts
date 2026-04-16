import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { assetApi } from '../api/assets.api';
import type { AssetFilterParams } from '../types';

const ASSETS_KEY = ['assets'];

export function useAssets(params?: AssetFilterParams) {
  return useQuery({
    queryKey: [...ASSETS_KEY, 'list', params],
    queryFn: () => assetApi.getAll(params).then((res) => res.data.data),
    enabled: !params?.view || params.view === 'list',
  });
}

export function useAssetsGrouped(params?: AssetFilterParams) {
  return useQuery({
    queryKey: [...ASSETS_KEY, 'grouped', params],
    queryFn: () => assetApi.getAllGrouped(params).then((res) => res.data.data),
    enabled: params?.view === 'group',
  });
}

export function useAsset(id: string | undefined) {
  return useQuery({
    queryKey: [...ASSETS_KEY, id],
    queryFn: () => assetApi.getById(id!).then((res) => res.data.data),
    enabled: !!id,
  });
}

export function useAssetHistory(assetId: string | undefined, page = 1, limit = 20) {
  return useQuery({
    queryKey: [...ASSETS_KEY, assetId, 'history', page],
    queryFn: () => assetApi.getHistory(assetId!, { page, limit }).then((res) => res.data.data),
    enabled: !!assetId,
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

export function useReportDamage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      assetId,
      data,
    }: {
      assetId: string;
      data: { issueDescription: string; condition: string; note?: string };
    }) => assetApi.reportDamage(assetId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ASSETS_KEY });
    },
  });
}

export function useReportLost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      assetId,
      data,
    }: {
      assetId: string;
      data: { issueDescription: string; lostDate?: string; note?: string };
    }) => assetApi.reportLost(assetId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ASSETS_KEY });
    },
  });
}
