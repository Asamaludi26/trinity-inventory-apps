import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { DollarSign } from 'lucide-react';
import type { CategorySpending } from '../types';

const DEFAULT_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

interface SpendingByCategoryChartProps {
  data: CategorySpending[];
  isLoading?: boolean;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

const formatShortCurrency = (value: number) => {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}M`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}Jt`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}Rb`;
  return String(value);
};

export function SpendingByCategoryChart({ data, isLoading }: SpendingByCategoryChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <DollarSign className="size-4" />
          Pengeluaran per Kategori
        </CardTitle>
      </CardHeader>
      <CardContent className="px-6">
        {isLoading ? (
          <Skeleton className="h-[280px] w-full" />
        ) : !data.length ? (
          <p className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
            Belum ada data pengeluaran kategori.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="category"
                className="text-xs fill-muted-foreground"
                tickLine={false}
                axisLine={false}
                interval={0}
                angle={-30}
                textAnchor="end"
                height={60}
              />
              <YAxis
                className="text-xs fill-muted-foreground"
                tickLine={false}
                axisLine={false}
                tickFormatter={formatShortCurrency}
              />
              <Tooltip
                formatter={(value: number) => [formatCurrency(value), 'Pengeluaran']}
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid hsl(var(--border))',
                  backgroundColor: 'hsl(var(--card))',
                  color: 'hsl(var(--card-foreground))',
                }}
              />
              <Bar dataKey="totalSpent" radius={[4, 4, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell
                    key={entry.category}
                    fill={entry.fill || DEFAULT_COLORS[index % DEFAULT_COLORS.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
