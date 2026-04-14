import { IsOptional, IsDateString, IsIn } from 'class-validator';

export type DashboardPreset = 'today' | '7d' | '30d' | '3m' | '6m' | '1y';

export class DashboardQueryDto {
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  @IsIn(['today', '7d', '30d', '3m', '6m', '1y'])
  preset?: DashboardPreset;
}

export interface DateRange {
  from: Date;
  to: Date;
}

export function resolveDashboardDateRange(query: DashboardQueryDto): DateRange {
  const to = query.dateTo ? new Date(query.dateTo) : new Date();
  to.setHours(23, 59, 59, 999);

  if (query.dateFrom) {
    const from = new Date(query.dateFrom);
    from.setHours(0, 0, 0, 0);
    return { from, to };
  }

  if (query.preset) {
    const from = new Date(to);
    switch (query.preset) {
      case 'today':
        from.setHours(0, 0, 0, 0);
        break;
      case '7d':
        from.setDate(from.getDate() - 7);
        break;
      case '3m':
        from.setMonth(from.getMonth() - 3);
        break;
      case '6m':
        from.setMonth(from.getMonth() - 6);
        break;
      case '1y':
        from.setFullYear(from.getFullYear() - 1);
        break;
      default:
        from.setDate(from.getDate() - 30);
    }
    return { from, to };
  }

  // Default: last 30 days
  const from = new Date(to);
  from.setDate(from.getDate() - 30);
  return { from, to };
}
