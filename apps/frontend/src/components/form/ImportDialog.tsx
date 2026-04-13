import { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, Download, AlertCircle, CheckCircle2 } from 'lucide-react';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  useImportAssets,
  usePreviewImportAssets,
  useDownloadImportTemplate,
} from '@/hooks/use-export-import';
import { useQueryClient } from '@tanstack/react-query';
import type { ImportPreviewResult } from '@/lib/export-import';

const ACCEPTED_EXTENSIONS = '.xlsx,.xls,.csv';

type Step = 'upload' | 'preview' | 'done';

export function ImportDialog() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportPreviewResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const importMutation = useImportAssets();
  const previewMutation = usePreviewImportAssets();
  const templateMutation = useDownloadImportTemplate();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setPreview(null);
      setStep('upload');
    }
  };

  const handlePreview = async () => {
    if (!file) return;
    const result = await previewMutation.mutateAsync(file);
    setPreview(result);
    setStep('preview');
  };

  const handleImport = async () => {
    if (!file) return;
    await importMutation.mutateAsync(file);
    queryClient.invalidateQueries({ queryKey: ['assets'] });
    setStep('done');
  };

  const handleClose = () => {
    setFile(null);
    setPreview(null);
    setStep('upload');
    setOpen(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleBack = () => {
    setStep('upload');
  };

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? setOpen(v) : handleClose())}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="mr-2 h-4 w-4" />
          Import
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import Data Aset</DialogTitle>
          <DialogDescription>
            {step === 'upload' && 'Upload file Excel atau CSV untuk preview sebelum import.'}
            {step === 'preview' && 'Periksa data sebelum diimport ke sistem.'}
            {step === 'done' && 'Proses import selesai.'}
          </DialogDescription>
        </DialogHeader>

        {/* ── Step 1: Upload ── */}
        {step === 'upload' && (
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
                  Klik untuk pilih file atau drag &amp; drop
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
          </div>
        )}

        {/* ── Step 2: Preview ── */}
        {step === 'preview' && preview && (
          <div className="flex flex-col gap-3 py-2">
            {/* Summary badges */}
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Total: {preview.totalRows} baris</Badge>
              <Badge variant="default" className="bg-green-600">
                <CheckCircle2 className="mr-1 h-3 w-3" />
                Valid: {preview.validCount}
              </Badge>
              {preview.errorCount > 0 && (
                <Badge variant="destructive">
                  <AlertCircle className="mr-1 h-3 w-3" />
                  Error: {preview.errorCount}
                </Badge>
              )}
            </div>

            {/* Error list */}
            {preview.errors.length > 0 && (
              <div className="max-h-24 overflow-y-auto rounded-md border border-destructive/30 bg-destructive/5 p-2 text-xs text-destructive">
                {preview.errors.map((err, i) => (
                  <p key={i}>
                    {err.row > 0 ? `Baris ${err.row}: ` : ''}
                    {err.field} — {err.message}
                  </p>
                ))}
              </div>
            )}

            {/* Valid rows preview */}
            {preview.rows.length > 0 && (
              <div className="max-h-56 overflow-y-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[60px]">Baris</TableHead>
                      <TableHead>Kode</TableHead>
                      <TableHead>Nama Aset</TableHead>
                      <TableHead>Kategori</TableHead>
                      <TableHead>Brand</TableHead>
                      <TableHead>S/N</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {preview.rows.map((row) => (
                      <TableRow key={row.row}>
                        <TableCell className="text-xs text-muted-foreground">{row.row}</TableCell>
                        <TableCell className="font-mono text-xs">{row.code}</TableCell>
                        <TableCell className="text-sm">{row.name}</TableCell>
                        <TableCell className="text-xs">{row.category}</TableCell>
                        <TableCell className="text-xs">{row.brand}</TableCell>
                        <TableCell className="text-xs">{row.serialNumber ?? '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        )}

        {/* ── Step 3: Done ── */}
        {step === 'done' && importMutation.data && (
          <div className="rounded-lg border p-4 text-sm">
            <p className="mb-1 font-medium">Hasil Import:</p>
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

        <DialogFooter className="gap-2">
          {step === 'upload' && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Batal
              </Button>
              <Button onClick={handlePreview} disabled={!file || previewMutation.isPending}>
                {previewMutation.isPending ? 'Memvalidasi...' : 'Preview'}
              </Button>
            </>
          )}
          {step === 'preview' && (
            <>
              <Button variant="outline" onClick={handleBack}>
                Kembali
              </Button>
              <Button
                onClick={handleImport}
                disabled={!preview || preview.validCount === 0 || importMutation.isPending}
              >
                {importMutation.isPending
                  ? 'Mengimport...'
                  : `Import ${preview?.validCount ?? 0} Aset`}
              </Button>
            </>
          )}
          {step === 'done' && <Button onClick={handleClose}>Tutup</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
