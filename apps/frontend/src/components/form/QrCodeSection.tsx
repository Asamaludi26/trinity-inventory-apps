import { Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAssetQrCode, useDownloadQrCode } from '@/hooks/use-export-import';

interface QrCodeSectionProps {
  assetId: string;
  assetCode: string;
}

export function QrCodeSection({ assetId, assetCode }: QrCodeSectionProps) {
  const { data: qrDataUrl, isLoading } = useAssetQrCode(assetId);
  const downloadMutation = useDownloadQrCode();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">QR Code</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-3">
        {isLoading ? (
          <Skeleton className="h-40 w-40" />
        ) : qrDataUrl ? (
          <img
            src={qrDataUrl}
            alt={`QR Code - ${assetCode}`}
            className="h-40 w-40 rounded border"
            loading="lazy"
          />
        ) : (
          <div className="flex h-40 w-40 items-center justify-center rounded border text-sm text-muted-foreground">
            QR tidak tersedia
          </div>
        )}
        <p className="text-xs text-muted-foreground font-mono">{assetCode}</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => downloadMutation.mutate({ assetId, code: assetCode })}
          disabled={downloadMutation.isPending}
        >
          <Download className="mr-2 h-3 w-3" />
          {downloadMutation.isPending ? 'Mengunduh...' : 'Download QR'}
        </Button>
      </CardContent>
    </Card>
  );
}
