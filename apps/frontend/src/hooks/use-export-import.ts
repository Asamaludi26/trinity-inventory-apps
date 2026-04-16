import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { saveAs } from 'file-saver';
import {
  exportApi,
  importApi,
  qrCodeApi,
  barcodeApi,
  type ExportFormat,
  type ImportResult,
  type ImportPreviewResult,
} from '@/lib/export-import';

// ================================
// Export Hooks
// ================================

function downloadBlob(blob: Blob, filename: string) {
  saveAs(blob, filename);
}

function getFilenameFromResponse(
  response: { headers: Record<string, unknown> },
  fallback: string,
): string {
  const disposition = String(response.headers['content-disposition'] ?? '');
  if (disposition) {
    const match = /filename="?([^";\n]+)"?/.exec(disposition);
    if (match?.[1]) return match[1];
  }
  return fallback;
}

export function useExportAssets() {
  return useMutation({
    mutationFn: async (params: {
      format?: ExportFormat;
      search?: string;
      status?: string;
      condition?: string;
      categoryId?: number;
    }) => {
      const res = await exportApi.assets(params);
      const filename = getFilenameFromResponse(res, `aset.${params.format ?? 'xlsx'}`);
      downloadBlob(res.data as Blob, filename);
    },
    onSuccess: () => toast.success('Export berhasil diunduh'),
    onError: () => toast.error('Gagal mengexport data'),
  });
}

export function useExportRequests() {
  return useMutation({
    mutationFn: async (params: { format?: ExportFormat; search?: string; status?: string }) => {
      const res = await exportApi.requests(params);
      const filename = getFilenameFromResponse(res, `permintaan.${params.format ?? 'xlsx'}`);
      downloadBlob(res.data as Blob, filename);
    },
    onSuccess: () => toast.success('Export berhasil diunduh'),
    onError: () => toast.error('Gagal mengexport data'),
  });
}

export function useExportLoans() {
  return useMutation({
    mutationFn: async (params: { format?: ExportFormat; search?: string; status?: string }) => {
      const res = await exportApi.loans(params);
      const filename = getFilenameFromResponse(res, `peminjaman.${params.format ?? 'xlsx'}`);
      downloadBlob(res.data as Blob, filename);
    },
    onSuccess: () => toast.success('Export berhasil diunduh'),
    onError: () => toast.error('Gagal mengexport data'),
  });
}

export function useExportCustomers() {
  return useMutation({
    mutationFn: async (params: { format?: ExportFormat; search?: string; isActive?: string }) => {
      const res = await exportApi.customers(params);
      const filename = getFilenameFromResponse(res, `pelanggan.${params.format ?? 'xlsx'}`);
      downloadBlob(res.data as Blob, filename);
    },
    onSuccess: () => toast.success('Export berhasil diunduh'),
    onError: () => toast.error('Gagal mengexport data'),
  });
}

export function useExportStock() {
  return useMutation({
    mutationFn: async (params: {
      format?: ExportFormat;
      search?: string;
      movementType?: string;
      startDate?: string;
      endDate?: string;
    }) => {
      const res = await exportApi.stock(params);
      const filename = getFilenameFromResponse(res, `stok.${params.format ?? 'xlsx'}`);
      downloadBlob(res.data as Blob, filename);
    },
    onSuccess: () => toast.success('Export berhasil diunduh'),
    onError: () => toast.error('Gagal mengexport data'),
  });
}

export function useExportHandovers() {
  return useMutation({
    mutationFn: async (params: { format?: ExportFormat; search?: string; status?: string }) => {
      const res = await exportApi.handovers(params);
      const filename = getFilenameFromResponse(res, `serah-terima.${params.format ?? 'xlsx'}`);
      downloadBlob(res.data as Blob, filename);
    },
    onSuccess: () => toast.success('Export berhasil diunduh'),
    onError: () => toast.error('Gagal mengexport data'),
  });
}

export function useExportRepairs() {
  return useMutation({
    mutationFn: async (params: { format?: ExportFormat; search?: string; status?: string }) => {
      const res = await exportApi.repairs(params);
      const filename = getFilenameFromResponse(res, `perbaikan.${params.format ?? 'xlsx'}`);
      downloadBlob(res.data as Blob, filename);
    },
    onSuccess: () => toast.success('Export berhasil diunduh'),
    onError: () => toast.error('Gagal mengexport data'),
  });
}

// ================================
// Import Hooks
// ================================

export function useImportAssets() {
  return useMutation({
    mutationFn: (file: File) => importApi.assets(file).then((res) => res.data.data as ImportResult),
    onSuccess: (data) => {
      if (data.errorCount > 0) {
        toast.warning(`Import selesai: ${data.successCount} berhasil, ${data.errorCount} gagal`);
      } else {
        toast.success(`${data.successCount} aset berhasil diimport`);
      }
    },
    onError: () => toast.error('Gagal mengimport data'),
  });
}

export function usePreviewImportAssets() {
  return useMutation({
    mutationFn: (file: File) =>
      importApi.previewAssets(file).then((res) => res.data.data as ImportPreviewResult),
    onError: () => toast.error('Gagal memvalidasi file import'),
  });
}

export function useDownloadImportTemplate() {
  return useMutation({
    mutationFn: async () => {
      const res = await importApi.template();
      downloadBlob(res.data as Blob, 'template_import_aset.xlsx');
    },
    onSuccess: () => toast.success('Template berhasil diunduh'),
    onError: () => toast.error('Gagal mengunduh template'),
  });
}

// ================================
// QR Code Hooks
// ================================

export function useAssetQrCode(assetId: string | undefined) {
  return useQuery({
    queryKey: ['qrcode', assetId],
    queryFn: () => qrCodeApi.getDataUrl(assetId!).then((res) => res.data.data.dataUrl),
    enabled: !!assetId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useDownloadQrCode() {
  return useMutation({
    mutationFn: async (params: { assetId: string; code: string }) => {
      const res = await qrCodeApi.getImage(params.assetId);
      downloadBlob(res.data as Blob, `qr_${params.code}.png`);
    },
    onSuccess: () => toast.success('QR code berhasil diunduh'),
    onError: () => toast.error('Gagal mengunduh QR code'),
  });
}

// ================================
// Barcode Hooks
// ================================

export function useAssetBarcode(assetId: string | undefined) {
  return useQuery({
    queryKey: ['barcode', assetId],
    queryFn: () => barcodeApi.getDataUrl(assetId!).then((res) => res.data.data.dataUrl),
    enabled: !!assetId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useDownloadBarcode() {
  return useMutation({
    mutationFn: async (params: { assetId: string; code: string }) => {
      const res = await barcodeApi.getImage(params.assetId);
      downloadBlob(res.data as Blob, `barcode_${params.code}.png`);
    },
    onSuccess: () => toast.success('Barcode berhasil diunduh'),
    onError: () => toast.error('Gagal mengunduh barcode'),
  });
}
