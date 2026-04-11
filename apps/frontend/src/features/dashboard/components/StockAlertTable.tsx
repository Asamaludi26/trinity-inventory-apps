import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { StockAlertItem } from '../types';

interface StockAlertTableProps {
  items: StockAlertItem[];
  isLoading?: boolean;
}

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  CRITICAL: {
    label: 'KRITIS',
    className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  },
  WARNING: {
    label: 'DEKAT',
    className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  },
  SAFE: {
    label: 'AMAN',
    className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  },
};

export function StockAlertTable({ items, isLoading }: StockAlertTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertTriangle className="size-4 text-destructive" />
          Stok di Bawah Threshold
        </CardTitle>
      </CardHeader>
      <CardContent className="px-6">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            title="Semua stok aman"
            description="Tidak ada stok yang berada di bawah threshold"
            className="py-8"
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Model</TableHead>
                <TableHead>Brand</TableHead>
                <TableHead className="text-right">Stok</TableHead>
                <TableHead className="text-right">Threshold</TableHead>
                <TableHead className="w-[100px]">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => {
                const style = STATUS_STYLES[item.status] ?? STATUS_STYLES.SAFE;
                return (
                  <TableRow
                    key={item.id}
                    className={item.status === 'CRITICAL' ? 'bg-red-50/50 dark:bg-red-950/10' : ''}
                  >
                    <TableCell className="font-medium">{item.modelName}</TableCell>
                    <TableCell>{item.brand}</TableCell>
                    <TableCell className="text-right">{item.currentStock}</TableCell>
                    <TableCell className="text-right">{item.threshold}</TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
                          style.className,
                        )}
                      >
                        {style.label}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
