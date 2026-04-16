import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface AuditDiffViewProps {
  dataBefore: Record<string, unknown> | null;
  dataAfter: Record<string, unknown> | null;
  action: string;
}

function flattenObject(obj: Record<string, unknown>, prefix = ''): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(result, flattenObject(value as Record<string, unknown>, fullKey));
    } else {
      result[fullKey] = value;
    }
  }
  return result;
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '-';
  if (typeof value === 'boolean') return value ? 'Ya' : 'Tidak';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

export function AuditDiffView({ dataBefore, dataAfter, action }: AuditDiffViewProps) {
  if (action === 'CREATE' && dataAfter) {
    const flat = flattenObject(dataAfter);
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Data Dibuat</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {Object.entries(flat).map(([key, value]) => (
              <div key={key} className="flex items-start gap-2 text-sm">
                <span className="min-w-[160px] text-muted-foreground">{key}</span>
                <Badge
                  variant="outline"
                  className="bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                >
                  {formatValue(value)}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (action === 'DELETE' && dataBefore) {
    const flat = flattenObject(dataBefore);
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Data Dihapus</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {Object.entries(flat).map(([key, value]) => (
              <div key={key} className="flex items-start gap-2 text-sm">
                <span className="min-w-[160px] text-muted-foreground">{key}</span>
                <Badge
                  variant="outline"
                  className="bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                >
                  {formatValue(value)}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // UPDATE: show side-by-side diff
  const before = dataBefore ? flattenObject(dataBefore) : {};
  const after = dataAfter ? flattenObject(dataAfter) : {};
  const allKeys = [...new Set([...Object.keys(before), ...Object.keys(after)])].sort();

  const changes = allKeys.filter((key) => {
    const bVal = formatValue(before[key]);
    const aVal = formatValue(after[key]);
    return bVal !== aVal;
  });

  if (changes.length === 0) {
    return (
      <Card>
        <CardContent className="py-4 text-center text-sm text-muted-foreground">
          Tidak ada perubahan terdeteksi.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Perubahan ({changes.length} field)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border">
          <div className="grid grid-cols-3 gap-px bg-muted text-xs font-medium">
            <div className="bg-background px-3 py-2">Field</div>
            <div className="bg-background px-3 py-2">Sebelum</div>
            <div className="bg-background px-3 py-2">Sesudah</div>
          </div>
          {changes.map((key) => (
            <div key={key} className="grid grid-cols-3 gap-px bg-muted text-sm">
              <div className="bg-background px-3 py-2 font-mono text-xs text-muted-foreground">
                {key}
              </div>
              <div className="bg-red-50/50 px-3 py-2 dark:bg-red-900/10">
                <span className="text-red-700 dark:text-red-400">{formatValue(before[key])}</span>
              </div>
              <div className="bg-green-50/50 px-3 py-2 dark:bg-green-900/10">
                <span className="text-green-700 dark:text-green-400">
                  {formatValue(after[key])}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
