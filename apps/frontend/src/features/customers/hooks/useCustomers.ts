import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { customerApi } from '../api';
import type { CustomerFilterParams } from '../types';

const QUERY_KEY = ['customers'] as const;

export function useCustomers(params?: CustomerFilterParams) {
  return useQuery({
    queryKey: [...QUERY_KEY, params],
    queryFn: () => customerApi.getAll(params).then((r) => r.data.data),
  });
}

export function useCustomer(uuid: string) {
  return useQuery({
    queryKey: [...QUERY_KEY, uuid],
    queryFn: () => customerApi.getById(uuid).then((r) => r.data.data),
    enabled: !!uuid,
  });
}

export function useCreateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      customerApi.create(data).then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success('Pelanggan berhasil ditambahkan');
    },
    onError: () => toast.error('Gagal menambahkan pelanggan'),
  });
}

export function useUpdateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ uuid, data }: { uuid: string; data: Record<string, unknown> }) =>
      customerApi.update(uuid, data).then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success('Pelanggan berhasil diperbarui');
    },
    onError: () => toast.error('Gagal memperbarui pelanggan'),
  });
}

export function useDeleteCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (uuid: string) => customerApi.remove(uuid),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success('Pelanggan berhasil dihapus');
    },
    onError: () => toast.error('Gagal menghapus pelanggan'),
  });
}
