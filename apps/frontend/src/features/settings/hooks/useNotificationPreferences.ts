import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { profileApi, type NotificationPreferences } from '../api';

const NOTIFICATION_PREFS_KEY = ['settings', 'notification-preferences'];

export function useNotificationPreferences() {
  return useQuery({
    queryKey: NOTIFICATION_PREFS_KEY,
    queryFn: () => profileApi.getNotificationPrefs().then((res) => res.data.data),
  });
}

export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<NotificationPreferences>) =>
      profileApi.updateNotificationPrefs(data).then((res) => res.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_PREFS_KEY });
      toast.success('Preferensi notifikasi berhasil disimpan');
    },
    onError: () => {
      toast.error('Gagal menyimpan preferensi notifikasi');
    },
  });
}
