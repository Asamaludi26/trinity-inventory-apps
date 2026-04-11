import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp } from 'lucide-react';
import type { AssetTrendData } from '../types';

interface AssetTrendChartProps {
  data: AssetTrendData[];
  isLoading?: boolean;
}

export function AssetTrendChart({ data, isLoading }: AssetTrendChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp className="size-4" />
          Tren Aset (6 Bulan)
        </CardTitle>
      </CardHeader>
      <CardContent className="px-6">
        {isLoading ? (
          <Skeleton className="h-[250px] w-full" />
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="month"
                className="text-xs fill-muted-foreground"
                tickLine={false}
                axisLine={false}
              />
              <YAxis className="text-xs fill-muted-foreground" tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid hsl(var(--border))',
                  backgroundColor: 'hsl(var(--card))',
                  color: 'hsl(var(--card-foreground))',
                }}
              />
              <Line
                type="monotone"
                dataKey="total"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ r: 3 }}
                name="Total Aset"
              />
              <Line
                type="monotone"
                dataKey="added"
                stroke="hsl(var(--success))"
                strokeWidth={2}
                dot={{ r: 3 }}
                name="Ditambahkan"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
