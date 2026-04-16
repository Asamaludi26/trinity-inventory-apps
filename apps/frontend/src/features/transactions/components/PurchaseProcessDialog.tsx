import { useState } from 'react';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface PurchaseProcessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (data: PurchaseProcessData) => void;
  isPending: boolean;
}

export interface PurchaseProcessData {
  vendorName: string;
  vendorContact: string;
  poNumber: string;
  estimatedDelivery: string;
  note: string;
}

export function PurchaseProcessDialog({
  open,
  onOpenChange,
  onConfirm,
  isPending,
}: PurchaseProcessDialogProps) {
  const [vendorName, setVendorName] = useState('');
  const [vendorContact, setVendorContact] = useState('');
  const [poNumber, setPoNumber] = useState('');
  const [estimatedDelivery, setEstimatedDelivery] = useState('');
  const [note, setNote] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm({ vendorName, vendorContact, poNumber, estimatedDelivery, note });
  };

  const handleOpenChange = (value: boolean) => {
    if (!value) {
      setVendorName('');
      setVendorContact('');
      setPoNumber('');
      setEstimatedDelivery('');
      setNote('');
    }
    onOpenChange(value);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Proses Pengadaan</DialogTitle>
          <DialogDescription>
            Isi informasi vendor dan PO untuk proses pengadaan barang.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pp-vendor-name">Nama Vendor</Label>
            <Input
              id="pp-vendor-name"
              value={vendorName}
              onChange={(e) => setVendorName(e.target.value)}
              placeholder="Contoh: PT. Sumber Jaya"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pp-vendor-contact">Kontak Vendor</Label>
            <Input
              id="pp-vendor-contact"
              value={vendorContact}
              onChange={(e) => setVendorContact(e.target.value)}
              placeholder="Contoh: 0812-xxxx-xxxx"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pp-po-number">Nomor PO</Label>
            <Input
              id="pp-po-number"
              value={poNumber}
              onChange={(e) => setPoNumber(e.target.value)}
              placeholder="Contoh: PO-2026-04-001"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pp-est-delivery">Estimasi Pengiriman</Label>
            <Input
              id="pp-est-delivery"
              type="date"
              value={estimatedDelivery}
              onChange={(e) => setEstimatedDelivery(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pp-note">Catatan</Label>
            <Textarea
              id="pp-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Catatan tambahan (opsional)"
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isPending}
            >
              Batal
            </Button>
            <Button type="submit" disabled={isPending || !vendorName.trim() || !poNumber.trim()}>
              {isPending ? 'Memproses...' : 'Proses Pengadaan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
