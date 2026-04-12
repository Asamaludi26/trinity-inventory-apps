import { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { useImportAssets, useDownloadImportTemplate } from '@/hooks/use-export-import';
import { useQueryClient } from '@tanstack/react-query';

const ACCEPTED_EXTENSIONS = '.xlsx,.xls,.csv';

export function ImportDialog() {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const importMutation = useImportAssets();
  const templateMutation = useDownloadImportTemplate();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) setFile(selected);
  };

  const handleImport = async () => {
    if (!file) return;
    await importMutation.mutateAsync(file);
    queryClient.invalidateQueries({ queryKey: ['assets'] });
    setFile(null);
    setOpen(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = () => {
    setFile(null);
    setOpen(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? setOpen(v) : handleClose())}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="mr-2 h-4 w-4" />
          Import
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import Data Aset</DialogTitle>
          <DialogDescription>
            Upload file Excel atau CSV untuk menambahkan data aset secara massal.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-4">
          <Button
            variant="link"
            className="h-auto justify-start p-0 text-sm"
            onClick={() => templateMutation.mutate()}
            disabled={templateMutation.isPending}
          >
            <Download className="mr-2 h-4 w-4" />
            {templateMutation.isPending ? 'Mengunduh...' : 'Download Template Import'}
          </Button>

          <div
            className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 transition-colors hover:border-primary cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <FileSpreadsheet className="h-10 w-10 text-muted-foreground" />
            {file ? (
              <p className="text-sm font-medium">{file.name}</p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Klik untuk pilih file atau drag & drop
              </p>
            )}
            <p className="text-xs text-muted-foreground">XLSX, XLS, CSV (maks 5MB)</p>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_EXTENSIONS}
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {importMutation.data && (
            <div className="rounded-lg border p-3 text-sm">
              <p>
                <span className="font-medium">Total:</span> {importMutation.data.totalRows} baris
              </p>
              <p className="text-green-600">
                <span className="font-medium">Berhasil:</span> {importMutation.data.successCount}
              </p>
              {importMutation.data.errorCount > 0 && (
                <>
                  <p className="text-red-600">
                    <span className="font-medium">Gagal:</span> {importMutation.data.errorCount}
                  </p>
                  <div className="mt-2 max-h-32 overflow-y-auto text-xs">
                    {importMutation.data.errors.map((err, i) => (
                      <p key={i} className="text-red-500">
                        {err.row > 0 ? `Baris ${err.row}: ` : ''}
                        {err.field} — {err.message}
                      </p>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Tutup
          </Button>
          <Button onClick={handleImport} disabled={!file || importMutation.isPending}>
            {importMutation.isPending ? 'Mengimport...' : 'Import'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
