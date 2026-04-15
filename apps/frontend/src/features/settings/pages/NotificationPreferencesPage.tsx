import { useState } from 'react';
import { Bell, Save } from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useNotificationPreferences, useUpdateNotificationPreferences } from '../hooks';
import type { NotificationPreferences } from '../api';

const CHANNEL_LABELS: Record<keyof NotificationPreferences['channels'], string> = {
  stock: 'Stok',
  requests: 'Permintaan',
  loans: 'Peminjaman',
  returns: 'Pengembalian',
  handovers: 'Serah Terima',
  repairs: 'Perbaikan',
  projects: 'Proyek',
};

function defaultPrefs(): NotificationPreferences {
  return {
    inAppEnabled: true,
    emailEnabled: false,
    whatsappEnabled: false,
    channels: {
      stock: true,
      requests: true,
      loans: true,
      returns: true,
      handovers: true,
      repairs: true,
      projects: true,
    },
  };
}

export function NotificationPreferencesPage() {
  const { data, isLoading } = useNotificationPreferences();
  const updatePrefs = useUpdateNotificationPreferences();
  const [draftPrefs, setDraftPrefs] = useState<NotificationPreferences | null>(null);

  if (isLoading) {
    return (
      <PageContainer title="Preferensi Notifikasi" description="Memuat preferensi...">
        <Card>
          <CardContent className="space-y-3 pt-6">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  const effectivePrefs = draftPrefs ?? data ?? defaultPrefs();

  const updateLocalPrefs = (
    updater: (current: NotificationPreferences) => NotificationPreferences,
  ) => {
    setDraftPrefs((prev) => updater(prev ?? data ?? defaultPrefs()));
  };

  const handleSave = () => {
    updatePrefs.mutate(effectivePrefs, {
      onSuccess: () => {
        setDraftPrefs(null);
      },
    });
  };

  return (
    <PageContainer
      title="Preferensi Notifikasi"
      description="Atur channel notifikasi sesuai kebutuhan Anda"
      actions={
        <Button onClick={handleSave} disabled={updatePrefs.isPending}>
          <Save className="mr-2 h-4 w-4" />
          {updatePrefs.isPending ? 'Menyimpan...' : 'Simpan Preferensi'}
        </Button>
      }
    >
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Bell className="h-5 w-5" />
              Channel Utama
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <Label htmlFor="pref-inapp">In-App Notification</Label>
              <input
                id="pref-inapp"
                type="checkbox"
                className="h-4 w-4"
                checked={effectivePrefs.inAppEnabled}
                onChange={(event) =>
                  updateLocalPrefs((prev) => ({
                    ...prev,
                    inAppEnabled: event.target.checked,
                  }))
                }
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <Label htmlFor="pref-email">Email Notification</Label>
              <input
                id="pref-email"
                type="checkbox"
                className="h-4 w-4"
                checked={effectivePrefs.emailEnabled}
                onChange={(event) =>
                  updateLocalPrefs((prev) => ({
                    ...prev,
                    emailEnabled: event.target.checked,
                  }))
                }
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <Label htmlFor="pref-whatsapp">WhatsApp Notification</Label>
              <input
                id="pref-whatsapp"
                type="checkbox"
                className="h-4 w-4"
                checked={effectivePrefs.whatsappEnabled}
                onChange={(event) =>
                  updateLocalPrefs((prev) => ({
                    ...prev,
                    whatsappEnabled: event.target.checked,
                  }))
                }
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Jenis Notifikasi</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {(Object.keys(CHANNEL_LABELS) as Array<keyof NotificationPreferences['channels']>).map(
              (channelKey) => (
                <div
                  key={channelKey}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <Label htmlFor={`channel-${channelKey}`}>{CHANNEL_LABELS[channelKey]}</Label>
                  <input
                    id={`channel-${channelKey}`}
                    type="checkbox"
                    className="h-4 w-4"
                    checked={effectivePrefs.channels[channelKey]}
                    onChange={(event) =>
                      updateLocalPrefs((prev) => ({
                        ...prev,
                        channels: {
                          ...prev.channels,
                          [channelKey]: event.target.checked,
                        },
                      }))
                    }
                  />
                </div>
              ),
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ringkasan Aktif</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {effectivePrefs.inAppEnabled && 'In-App aktif. '}
            {effectivePrefs.emailEnabled && 'Email aktif. '}
            {effectivePrefs.whatsappEnabled && 'WhatsApp aktif. '}
            {!effectivePrefs.inAppEnabled &&
              !effectivePrefs.emailEnabled &&
              !effectivePrefs.whatsappEnabled &&
              'Semua channel utama nonaktif.'}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}

export default NotificationPreferencesPage;
export const Component = NotificationPreferencesPage;
