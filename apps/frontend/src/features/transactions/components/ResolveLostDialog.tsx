import { useState } from 'react';
import { Search, CheckCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ResolveLostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (resolution: 'FOUND' | 'NOT_FOUND', note?: string) => void;
  isPending?: boolean;
}

export function ResolveLostDialog({
  open,
  onOpenChange,
  onConfirm,
  isPending = false,
}: ResolveLostDialogProps) {
  const [resolution, setResolution] = useState<'FOUND' | 'NOT_FOUND' | ''>('');
  const [note, setNote] = useState('');

  const handleConfirm = () => {
    if (!resolution) return;
    onConfirm(resolution, note.trim() || undefined);
  };

  const handleClose = (value: boolean) => {
    if (!value) {
      setResolution('');
      setNote('');
    }
    onOpenChange(value);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Resolve Laporan Aset Hilang
          </DialogTitle>
          <DialogDescription>
            Tentukan hasil investigasi untuk laporan aset hilang ini.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Hasil Investigasi</Label>
            <Select
              value={resolution}
              onValueChange={(v) => setResolution(v as 'FOUND' | 'NOT_FOUND')}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih hasil investigasi..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FOUND">
                  <span className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Ditemukan — Aset kembali ke gudang
                  </span>
                </SelectItem>
                <SelectItem value="NOT_FOUND">
                  <span className="flex items-center gap-2">
                    <span className="text-destructive">✕</span>
                    Tidak Ditemukan — Aset dihapuskan (decommission)
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="resolve-note">Catatan (opsional)</Label>
            <Textarea
              id="resolve-note"
              placeholder="Catatan hasil investigasi..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)}>
            Batal
          </Button>
          <Button onClick={handleConfirm} disabled={!resolution || isPending}>
            {isPending ? 'Memproses...' : 'Resolve'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
