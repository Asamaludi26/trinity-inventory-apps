import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ScanLine } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

const SCANNER_ELEMENT_ID = 'qr-scanner-viewport';

export function QRScannerDialog() {
  const [open, setOpen] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const navigate = useNavigate();

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch {
        // scanner may already be stopped
      }
      scannerRef.current = null;
    }
  };

  const startScanner = async () => {
    setIsStarting(true);
    try {
      const scanner = new Html5Qrcode(SCANNER_ELEMENT_ID);
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          // Expected format: asset code (e.g. AST-202501-00001) or a URL containing /assets/<id>
          void stopScanner().then(() => {
            setOpen(false);

            // Try to parse as a URL path /assets/<id>
            const urlMatch = /\/assets\/([a-zA-Z0-9-]+)/.exec(decodedText);
            if (urlMatch?.[1]) {
              navigate(`/assets/${urlMatch[1]}`);
              return;
            }

            // Treat as asset code — navigate to search
            navigate(`/assets?search=${encodeURIComponent(decodedText.trim())}`);
            toast.success(`QR terbaca: ${decodedText.trim()}`);
          });
        },
        undefined, // no error callback needed for frame-level errors
      );
    } catch {
      toast.error('Tidak dapat mengakses kamera. Pastikan izin kamera diberikan.');
    } finally {
      setIsStarting(false);
    }
  };

  useEffect(() => {
    if (open) {
      // Small delay to ensure the DOM element is mounted
      const timer = setTimeout(() => {
        void startScanner();
      }, 200);
      return () => clearTimeout(timer);
    } else {
      void stopScanner();
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleOpenChange = (value: boolean) => {
    if (!value) {
      void stopScanner();
    }
    setOpen(value);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="default">
          <ScanLine className="mr-2 h-4 w-4" />
          Scan QR
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Scan QR Code Aset</DialogTitle>
          <DialogDescription>
            Arahkan kamera ke QR code aset untuk membuka halaman detail.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-3 py-2">
          {isStarting && <p className="text-sm text-muted-foreground">Memulai kamera...</p>}
          <div
            id={SCANNER_ELEMENT_ID}
            className="w-full overflow-hidden rounded-lg border"
            style={{ minHeight: '280px' }}
          />
          <p className="text-xs text-muted-foreground text-center">
            Posisikan QR code di dalam bingkai untuk dipindai secara otomatis.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
