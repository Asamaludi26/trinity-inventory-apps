import { Button } from '@/components/ui/button';
import type { DashboardFilter, DashboardPreset } from '../types';
import { PRESET_LABELS } from '../types';

const PRESETS: DashboardPreset[] = ['today', '7d', '30d', '3m', '6m', '1y'];

interface DashboardTimeFilterProps {
  filter: DashboardFilter;
  onChange: (filter: DashboardFilter) => void;
}

export function DashboardTimeFilter({ filter, onChange }: DashboardTimeFilterProps) {
  const activePreset = filter.preset ?? '30d';

  return (
    <div className="flex flex-wrap gap-1">
      {PRESETS.map((preset) => (
        <Button
          key={preset}
          size="sm"
          variant={activePreset === preset ? 'default' : 'outline'}
          className="h-7 px-3 text-xs"
          onClick={() => onChange({ preset })}
        >
          {PRESET_LABELS[preset]}
        </Button>
      ))}
    </div>
  );
}
