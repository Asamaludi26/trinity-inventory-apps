import { Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAssetBarcode, useDownloadBarcode } from '@/hooks/use-export-import';

interface BarcodeSectionProps {
  assetId: string;
  assetCode: string;
}

export function BarcodeSection({ assetId, assetCode }: BarcodeSectionProps) {
  const { data: barcodeDataUrl, isLoading } = useAssetBarcode(assetId);
  const downloadMutation = useDownloadBarcode();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Barcode</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-3">
        {isLoading ? (
          <Skeleton className="h-20 w-48" />
        ) : barcodeDataUrl ? (
          <img
            src={barcodeDataUrl}
            alt={`Barcode - ${assetCode}`}
            className="h-20 w-auto rounded border"
            loading="lazy"
          />
        ) : (
          <div className="flex h-20 w-48 items-center justify-center rounded border text-sm text-muted-foreground">
            Barcode tidak tersedia
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
          {downloadMutation.isPending ? 'Mengunduh...' : 'Download Barcode'}
        </Button>
      </CardContent>
    </Card>
  );
}
