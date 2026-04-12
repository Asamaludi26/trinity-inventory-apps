import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { attachmentApi } from '@/lib/attachment';

const ATTACHMENTS_KEY = ['attachments'];

export function useAttachments(entityType: string, entityId: string | undefined) {
  return useQuery({
    queryKey: [...ATTACHMENTS_KEY, entityType, entityId],
    queryFn: () => attachmentApi.getByEntity(entityType, entityId!).then((res) => res.data.data),
    enabled: !!entityId,
  });
}

export function useUploadAttachment(entityType: string, entityId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (files: File[]) => attachmentApi.upload(entityType, entityId!, files),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...ATTACHMENTS_KEY, entityType, entityId],
      });
      toast.success('File berhasil diupload');
    },
    onError: () => {
      toast.error('Gagal mengupload file');
    },
  });
}

export function useDeleteAttachment(entityType: string, entityId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (attachmentId: number) => attachmentApi.remove(attachmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...ATTACHMENTS_KEY, entityType, entityId],
      });
      toast.success('Attachment berhasil dihapus');
    },
    onError: () => {
      toast.error('Gagal menghapus attachment');
    },
  });
}
