import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PieChartIcon } from 'lucide-react';
import type { AssetCategoryDistribution } from '../types';

interface CategoryDistributionChartProps {
  data: AssetCategoryDistribution[];
  isLoading?: boolean;
}

const DEFAULT_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

export function CategoryDistributionChart({ data, isLoading }: CategoryDistributionChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <PieChartIcon className="size-4" />
          Aset per Kategori
        </CardTitle>
      </CardHeader>
      <CardContent className="px-6">
        {isLoading ? (
          <Skeleton className="h-[250px] w-full" />
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={3}
                dataKey="count"
                nameKey="category"
              >
                {data.map((entry, index) => (
                  <Cell
                    key={entry.category}
                    fill={entry.fill || DEFAULT_COLORS[index % DEFAULT_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid hsl(var(--border))',
                  backgroundColor: 'hsl(var(--card))',
                  color: 'hsl(var(--card-foreground))',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
