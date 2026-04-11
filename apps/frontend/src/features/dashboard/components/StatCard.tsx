import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'warning' | 'danger';
  isLoading?: boolean;
  className?: string;
}

const VARIANT_STYLES = {
  default: 'bg-primary/10 text-primary',
  warning: 'bg-warning/10 text-warning',
  danger: 'bg-destructive/10 text-destructive',
};

export function StatCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  variant = 'default',
  isLoading = false,
  className,
}: StatCardProps) {
  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center gap-4 px-6">
          <Skeleton className="size-12 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-7 w-16" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardContent className="flex items-center gap-4 px-6">
        <div
          className={cn(
            'flex size-12 shrink-0 items-center justify-center rounded-lg',
            VARIANT_STYLES[variant],
          )}
        >
          <Icon className="size-6" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-muted-foreground truncate">{title}</p>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold tracking-tight">{value.toLocaleString('id-ID')}</p>
            {trend && (
              <span
                className={cn(
                  'text-xs font-medium',
                  trend.isPositive ? 'text-emerald-600' : 'text-red-600',
                )}
              >
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </span>
            )}
          </div>
          {description && <p className="text-xs text-muted-foreground truncate">{description}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
