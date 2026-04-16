import Barcode from 'react-barcode';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';

interface BarcodeLabelProps {
  assetCode: string;
  assetName: string;
  serialNumber?: string;
}

export function BarcodeLabel({ assetCode, assetName, serialNumber }: BarcodeLabelProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <Card className="mb-6 print:border-0 print:shadow-none">
      <CardHeader className="flex flex-row items-center justify-between pb-2 print:hidden">
        <CardTitle className="text-sm">Barcode Aset</CardTitle>
        <Button variant="outline" size="sm" onClick={handlePrint}>
          <Printer className="mr-2 h-4 w-4" />
          Cetak
        </Button>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center gap-2 rounded-lg border p-4 print:border-0">
          <Barcode
            value={assetCode}
            format="CODE128"
            width={2}
            height={60}
            displayValue={false}
            margin={0}
          />
          <p className="font-mono text-sm font-bold">{assetCode}</p>
          <p className="text-sm text-muted-foreground">{assetName}</p>
          {serialNumber && (
            <p className="font-mono text-xs text-muted-foreground">S/N: {serialNumber}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
