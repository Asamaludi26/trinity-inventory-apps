import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CalendarDays } from 'lucide-react';
import type { DashboardFilter, DashboardPreset } from '../types';
import { PRESET_LABELS } from '../types';

const PRESETS: DashboardPreset[] = ['today', '7d', '30d', '3m', '6m', '1y'];

interface DashboardTimeFilterProps {
  filter: DashboardFilter;
  onChange: (filter: DashboardFilter) => void;
}

export function DashboardTimeFilter({ filter, onChange }: DashboardTimeFilterProps) {
  const [isCustom, setIsCustom] = useState(
    Boolean(filter.dateFrom || filter.dateTo) && !filter.preset,
  );
  const [dateFrom, setDateFrom] = useState(filter.dateFrom ?? '');
  const [dateTo, setDateTo] = useState(filter.dateTo ?? '');

  const handlePresetClick = (preset: DashboardPreset) => {
    setIsCustom(false);
    onChange({ preset });
  };

  const handleCustomToggle = () => {
    setIsCustom(true);
    // Apply current custom dates if they exist
    if (dateFrom && dateTo) {
      onChange({ dateFrom, dateTo });
    }
  };

  const handleDateChange = (field: 'dateFrom' | 'dateTo', value: string) => {
    const newFrom = field === 'dateFrom' ? value : dateFrom;
    const newTo = field === 'dateTo' ? value : dateTo;

    if (field === 'dateFrom') setDateFrom(value);
    if (field === 'dateTo') setDateTo(value);

    if (newFrom && newTo) {
      onChange({ dateFrom: newFrom, dateTo: newTo });
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-1">
      {PRESETS.map((preset) => (
        <Button
          key={preset}
          size="sm"
          variant={!isCustom && (filter.preset ?? '30d') === preset ? 'default' : 'outline'}
          className="h-7 px-3 text-xs"
          onClick={() => handlePresetClick(preset)}
        >
          {PRESET_LABELS[preset]}
        </Button>
      ))}
      <Button
        size="sm"
        variant={isCustom ? 'default' : 'outline'}
        className="h-7 gap-1 px-3 text-xs"
        onClick={handleCustomToggle}
      >
        <CalendarDays className="size-3" />
        Kustom
      </Button>
      {isCustom && (
        <div className="flex items-center gap-1">
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => handleDateChange('dateFrom', e.target.value)}
            className="h-7 w-[130px] text-xs"
            max={dateTo || undefined}
            aria-label="Tanggal mulai"
          />
          <span className="text-muted-foreground text-xs">—</span>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => handleDateChange('dateTo', e.target.value)}
            className="h-7 w-[130px] text-xs"
            min={dateFrom || undefined}
            aria-label="Tanggal akhir"
          />
        </div>
      )}
    </div>
  );
}
