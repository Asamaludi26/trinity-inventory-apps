import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Search, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { api } from '@/lib/axios';
import { useReportLost } from '../hooks';
import type { ApiResponse, PaginatedResponse } from '@/types';

const reportLostSchema = z.object({
  assetId: z.string().min(1, 'Pilih aset yang akan dilaporkan hilang'),
  description: z.string().min(10, 'Deskripsi minimal 10 karakter'),
  note: z.string().optional(),
});

type ReportLostFormData = z.infer<typeof reportLostSchema>;

interface AssetOption {
  id: string;
  code: string;
  name: string;
  status: string;
}

interface ReportLostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function ReportLostDialog({ open, onOpenChange, onSuccess }: ReportLostDialogProps) {
  const reportLost = useReportLost();
  const [assetSearch, setAssetSearch] = useState('');
  const [searchResults, setSearchResults] = useState<AssetOption[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<AssetOption | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ReportLostFormData>({
    resolver: zodResolver(reportLostSchema),
  });

  const handleSearchAsset = async (query: string) => {
    setAssetSearch(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const res = await api.get<ApiResponse<PaginatedResponse<AssetOption>>>('/assets', {
        params: { search: query, limit: 10 },
      });
      const items = res.data.data?.data ?? [];
      // Filter out already LOST/DECOMMISSIONED/CONSUMED assets
      setSearchResults(
        items.filter(
          (a: AssetOption) => !['LOST', 'DECOMMISSIONED', 'CONSUMED'].includes(a.status),
        ),
      );
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectAsset = (asset: AssetOption) => {
    setSelectedAsset(asset);
    setValue('assetId', asset.id);
    setSearchResults([]);
    setAssetSearch('');
  };

  const onSubmit = (data: ReportLostFormData) => {
    reportLost.mutate(data, {
      onSuccess: () => {
        toast.success('Laporan aset hilang berhasil dibuat');
        handleClose();
        onSuccess?.();
      },
      onError: (err: Error) => {
        toast.error(err.message || 'Gagal membuat laporan aset hilang');
      },
    });
  };

  const handleClose = () => {
    reset();
    setSelectedAsset(null);
    setAssetSearch('');
    setSearchResults([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Lapor Aset Hilang
          </DialogTitle>
          <DialogDescription>
            Laporkan aset yang hilang. Laporan akan langsung diproses tanpa perlu approval dan
            notifikasi akan dikirim ke Superadmin & Admin Logistik.
          </DialogDescription>
        </DialogHeader>

        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Status aset akan langsung berubah menjadi LOST. Tindakan ini tidak dapat dibatalkan
            kecuali melalui proses resolve.
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Asset Picker */}
          <div className="space-y-2">
            <Label>Aset</Label>
            {selectedAsset ? (
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">{selectedAsset.name}</p>
                  <p className="font-mono text-xs text-muted-foreground">{selectedAsset.code}</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedAsset(null);
                    setValue('assetId', '');
                  }}
                >
                  Ganti
                </Button>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Cari kode atau nama aset..."
                    value={assetSearch}
                    onChange={(e) => handleSearchAsset(e.target.value)}
                    className="pl-9"
                  />
                </div>
                {(searchResults.length > 0 || isSearching) && (
                  <div className="max-h-48 overflow-y-auto rounded-lg border">
                    {isSearching ? (
                      <p className="p-3 text-center text-sm text-muted-foreground">Mencari...</p>
                    ) : (
                      searchResults.map((asset) => (
                        <button
                          key={asset.id}
                          type="button"
                          onClick={() => handleSelectAsset(asset)}
                          className="flex w-full items-center gap-3 border-b p-3 text-left last:border-b-0 hover:bg-muted/50"
                        >
                          <div>
                            <p className="text-sm font-medium">{asset.name}</p>
                            <p className="font-mono text-xs text-muted-foreground">{asset.code}</p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
                <input type="hidden" {...register('assetId')} />
                {errors.assetId && (
                  <p className="text-sm text-destructive">{errors.assetId.message}</p>
                )}
              </div>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="lost-description">Deskripsi Kejadian</Label>
            <Textarea
              id="lost-description"
              placeholder="Jelaskan kronologi hilangnya aset..."
              rows={3}
              {...register('description')}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>

          {/* Note */}
          <div className="space-y-2">
            <Label htmlFor="lost-note">Catatan Tambahan (opsional)</Label>
            <Textarea
              id="lost-note"
              placeholder="Catatan tambahan..."
              rows={2}
              {...register('note')}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Batal
            </Button>
            <Button type="submit" variant="destructive" disabled={reportLost.isPending}>
              {reportLost.isPending ? 'Melaporkan...' : 'Laporkan Hilang'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
