import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { profileApi } from '../api';
import { useAuthStore } from '@/store/useAuthStore';

export function useUploadAvatar() {
  const updateUser = useAuthStore((s) => s.updateUser);

  return useMutation({
    mutationFn: (file: File) => profileApi.uploadAvatar(file).then((res) => res.data.data),
    onSuccess: (data) => {
      updateUser({ avatarUrl: data.avatarUrl });
      toast.success('Foto profil berhasil diperbarui');
    },
    onError: () => {
      toast.error('Gagal mengupload foto profil');
    },
  });
}
