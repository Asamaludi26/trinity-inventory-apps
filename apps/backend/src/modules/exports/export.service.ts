import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import {
  ExportFormat,
  ExportAssetQueryDto,
  ExportTransactionQueryDto,
  ExportCustomerQueryDto,
} from './dto';
import { Prisma } from '../../generated/prisma/client';
import * as ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

// Status/Condition labels for human-readable export
const STATUS_LABELS: Record<string, string> = {
  IN_STORAGE: 'Di Gudang',
  IN_USE: 'Digunakan',
  IN_CUSTODY: 'Dipinjam',
  UNDER_REPAIR: 'Perbaikan',
  OUT_FOR_REPAIR: 'Reparasi Luar',
  DAMAGED: 'Rusak',
  LOST: 'Hilang',
  DECOMMISSIONED: 'Dekomisi',
  CONSUMED: 'Habis Pakai',
};

const CONDITION_LABELS: Record<string, string> = {
  NEW: 'Baru',
  GOOD: 'Baik',
  FAIR: 'Cukup',
  POOR: 'Buruk',
  BROKEN: 'Rusak',
};

const TRANSACTION_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Menunggu',
  LOGISTIC_APPROVED: 'Disetujui Logistik',
  AWAITING_CEO_APPROVAL: 'Menunggu CEO',
  APPROVED: 'Disetujui',
  REJECTED: 'Ditolak',
  CANCELLED: 'Dibatalkan',
  PURCHASING: 'Proses Beli',
  IN_DELIVERY: 'Dalam Pengiriman',
  ARRIVED: 'Tiba',
  AWAITING_HANDOVER: 'Menunggu Serah Terima',
  IN_PROGRESS: 'Berjalan',
  COMPLETED: 'Selesai',
};

@Injectable()
export class ExportService {
  constructor(private readonly prisma: PrismaService) {}

  // ──────────────── Asset Export ────────────────

  async exportAssets(
    query: ExportAssetQueryDto,
  ): Promise<{ buffer: Buffer; contentType: string; filename: string }> {
    const { format, search, status, condition, categoryId, typeId, modelId } =
      query;

    const where: Prisma.AssetWhereInput = {
      isDeleted: false,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { code: { contains: search, mode: 'insensitive' } },
          { serialNumber: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(status && { status }),
      ...(condition && { condition }),
      ...(categoryId && { categoryId }),
      ...(typeId && { typeId }),
      ...(modelId && { modelId }),
    };

    const assets = await this.prisma.asset.findMany({
      where,
      include: {
        category: { select: { name: true } },
        type: { select: { name: true } },
        model: { select: { name: true, brand: true } },
        currentUser: { select: { fullName: true } },
      },
      orderBy: { code: 'asc' },
    });

    const rows = assets.map((a) => ({
      code: a.code,
      name: a.name,
      category: a.category?.name ?? '-',
      type: a.type?.name ?? '-',
      model: a.model?.name ?? '-',
      brand: a.brand,
      serialNumber: a.serialNumber ?? '-',
      status: STATUS_LABELS[a.status] ?? a.status,
      condition: CONDITION_LABELS[a.condition] ?? a.condition,
      holder: a.currentUser?.fullName ?? '-',
      purchasePrice: a.purchasePrice ? Number(a.purchasePrice) : 0,
      purchaseDate: a.purchaseDate
        ? new Intl.DateTimeFormat('id-ID').format(a.purchaseDate)
        : '-',
    }));

    const columns = [
      { header: 'Kode', key: 'code', width: 15 },
      { header: 'Nama Aset', key: 'name', width: 25 },
      { header: 'Kategori', key: 'category', width: 18 },
      { header: 'Tipe', key: 'type', width: 18 },
      { header: 'Model', key: 'model', width: 18 },
      { header: 'Brand', key: 'brand', width: 15 },
      { header: 'S/N', key: 'serialNumber', width: 20 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Kondisi', key: 'condition', width: 12 },
      { header: 'Pemegang', key: 'holder', width: 20 },
      { header: 'Harga Beli', key: 'purchasePrice', width: 18 },
      { header: 'Tgl Beli', key: 'purchaseDate', width: 15 },
    ];

    switch (format) {
      case ExportFormat.XLSX:
        return this.generateExcel('Daftar Aset', columns, rows, 'aset');
      case ExportFormat.CSV:
        return this.generateCsv(columns, rows, 'aset');
      case ExportFormat.PDF:
        return this.generatePdf('Daftar Aset', columns, rows, 'aset');
      default:
        throw new BadRequestException(`Format '${format}' tidak didukung`);
    }
  }

  // ──────────────── Transaction Export ────────────────

  async exportRequests(query: ExportTransactionQueryDto) {
    const where: Prisma.RequestWhereInput = {
      isDeleted: false,
      ...(query.search && {
        OR: [
          { code: { contains: query.search, mode: 'insensitive' } },
          { title: { contains: query.search, mode: 'insensitive' } },
        ],
      }),
      ...(query.status && { status: query.status as never }),
    };

    const data = await this.prisma.request.findMany({
      where,
      include: {
        createdBy: { select: { fullName: true } },
        items: { select: { id: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const rows = data.map((r) => ({
      code: r.code,
      title: r.title,
      status: TRANSACTION_STATUS_LABELS[r.status] ?? r.status,
      priority: r.priority,
      itemCount: r.items.length,
      createdBy: r.createdBy?.fullName ?? '-',
      createdAt: new Intl.DateTimeFormat('id-ID').format(r.createdAt),
    }));

    const columns = [
      { header: 'No. Dokumen', key: 'code', width: 20 },
      { header: 'Judul', key: 'title', width: 30 },
      { header: 'Status', key: 'status', width: 18 },
      { header: 'Prioritas', key: 'priority', width: 12 },
      { header: 'Jumlah Item', key: 'itemCount', width: 12 },
      { header: 'Dibuat Oleh', key: 'createdBy', width: 20 },
      { header: 'Tanggal', key: 'createdAt', width: 15 },
    ];

    return this.generateByFormat(
      query.format,
      'Daftar Permintaan',
      columns,
      rows,
      'permintaan',
    );
  }

  async exportLoans(query: ExportTransactionQueryDto) {
    const where: Prisma.LoanRequestWhereInput = {
      isDeleted: false,
      ...(query.search && {
        OR: [
          { code: { contains: query.search, mode: 'insensitive' } },
          { purpose: { contains: query.search, mode: 'insensitive' } },
        ],
      }),
      ...(query.status && { status: query.status as never }),
    };

    const data = await this.prisma.loanRequest.findMany({
      where,
      include: {
        createdBy: { select: { fullName: true } },
        items: { select: { id: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const rows = data.map((l) => ({
      code: l.code,
      purpose: l.purpose,
      status: TRANSACTION_STATUS_LABELS[l.status] ?? l.status,
      itemCount: l.items.length,
      expectedReturn: l.expectedReturn
        ? new Intl.DateTimeFormat('id-ID').format(l.expectedReturn)
        : '-',
      createdBy: l.createdBy?.fullName ?? '-',
      createdAt: new Intl.DateTimeFormat('id-ID').format(l.createdAt),
    }));

    const columns = [
      { header: 'No. Dokumen', key: 'code', width: 20 },
      { header: 'Tujuan', key: 'purpose', width: 30 },
      { header: 'Status', key: 'status', width: 18 },
      { header: 'Jumlah Item', key: 'itemCount', width: 12 },
      { header: 'Tgl Kembali', key: 'expectedReturn', width: 15 },
      { header: 'Dibuat Oleh', key: 'createdBy', width: 20 },
      { header: 'Tanggal', key: 'createdAt', width: 15 },
    ];

    return this.generateByFormat(
      query.format,
      'Daftar Peminjaman',
      columns,
      rows,
      'peminjaman',
    );
  }

  // ──────────────── Customer Export ────────────────

  async exportCustomers(query: ExportCustomerQueryDto) {
    const isActive =
      query.isActive === 'true'
        ? true
        : query.isActive === 'false'
          ? false
          : undefined;

    const where: Prisma.CustomerWhereInput = {
      isDeleted: false,
      ...(query.search && {
        OR: [
          { name: { contains: query.search, mode: 'insensitive' } },
          { code: { contains: query.search, mode: 'insensitive' } },
        ],
      }),
      ...(isActive !== undefined && { isActive }),
    };

    const data = await this.prisma.customer.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    const rows = data.map((c) => ({
      code: c.code,
      name: c.name,
      address: c.address ?? '-',
      phone: c.phone ?? '-',
      email: c.email ?? '-',
      isActive: c.isActive ? 'Aktif' : 'Tidak Aktif',
      createdAt: new Intl.DateTimeFormat('id-ID').format(c.createdAt),
    }));

    const columns = [
      { header: 'Kode', key: 'code', width: 15 },
      { header: 'Nama', key: 'name', width: 25 },
      { header: 'Alamat', key: 'address', width: 30 },
      { header: 'Telepon', key: 'phone', width: 15 },
      { header: 'Email', key: 'email', width: 25 },
      { header: 'Status', key: 'isActive', width: 12 },
      { header: 'Tgl Dibuat', key: 'createdAt', width: 15 },
    ];

    return this.generateByFormat(
      query.format,
      'Daftar Pelanggan',
      columns,
      rows,
      'pelanggan',
    );
  }

  // ──────────────── Format Router ────────────────

  private generateByFormat(
    format: ExportFormat,
    title: string,
    columns: Array<{ header: string; key: string; width: number }>,
    rows: Record<string, unknown>[],
    filePrefix: string,
  ) {
    switch (format) {
      case ExportFormat.XLSX:
        return this.generateExcel(title, columns, rows, filePrefix);
      case ExportFormat.CSV:
        return this.generateCsv(columns, rows, filePrefix);
      case ExportFormat.PDF:
        return this.generatePdf(title, columns, rows, filePrefix);
      default:
        throw new BadRequestException(`Format '${format}' tidak didukung`);
    }
  }

  // ──────────────── Excel Generator ────────────────

  private async generateExcel(
    title: string,
    columns: Array<{ header: string; key: string; width: number }>,
    rows: Record<string, unknown>[],
    filePrefix: string,
  ) {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Trinity Inventory';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet(title);

    // Header row styling
    sheet.columns = columns.map((col) => ({
      header: col.header,
      key: col.key,
      width: col.width,
    }));

    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1F2937' },
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 28;

    // Data rows
    for (const row of rows) {
      const dataRow = sheet.addRow(row);
      dataRow.alignment = { vertical: 'middle' };
    }

    // Auto-filter
    sheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: rows.length + 1, column: columns.length },
    };

    // Alternating row colors
    for (let i = 2; i <= rows.length + 1; i++) {
      if (i % 2 === 0) {
        sheet.getRow(i).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF9FAFB' },
        };
      }
    }

    const buffer = Buffer.from(await workbook.xlsx.writeBuffer());
    const date = new Intl.DateTimeFormat('id-ID', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
      .format(new Date())
      .replace(/\//g, '-');

    return {
      buffer,
      contentType:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      filename: `${filePrefix}_${date}.xlsx`,
    };
  }

  // ──────────────── CSV Generator ────────────────

  private async generateCsv(
    columns: Array<{ header: string; key: string; width: number }>,
    rows: Record<string, unknown>[],
    filePrefix: string,
  ) {
    const headers = columns.map((c) => c.header);
    const csvRows = [
      headers.join(','),
      ...rows.map((row) =>
        columns
          .map((col) => {
            const value = String(row[col.key] ?? '');
            // Escape CSV values containing commas, quotes, or newlines
            if (
              value.includes(',') ||
              value.includes('"') ||
              value.includes('\n')
            ) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          })
          .join(','),
      ),
    ];

    // Add BOM for UTF-8 Excel compatibility
    const bom = '\uFEFF';
    const buffer = Buffer.from(bom + csvRows.join('\n'), 'utf-8');
    const date = new Intl.DateTimeFormat('id-ID', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
      .format(new Date())
      .replace(/\//g, '-');

    return {
      buffer,
      contentType: 'text/csv; charset=utf-8',
      filename: `${filePrefix}_${date}.csv`,
    };
  }

  // ──────────────── PDF Generator ────────────────

  private async generatePdf(
    title: string,
    columns: Array<{ header: string; key: string; width: number }>,
    rows: Record<string, unknown>[],
    filePrefix: string,
  ) {
    return new Promise<{
      buffer: Buffer;
      contentType: string;
      filename: string;
    }>((resolve) => {
      const doc = new PDFDocument({
        size: 'A4',
        layout: 'landscape',
        margin: 40,
      });
      const chunks: Uint8Array[] = [];

      doc.on('data', (chunk: Uint8Array) => chunks.push(chunk));
      doc.on('end', () => {
        const buffer = Buffer.concat(chunks);
        const date = new Intl.DateTimeFormat('id-ID', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        })
          .format(new Date())
          .replace(/\//g, '-');

        resolve({
          buffer,
          contentType: 'application/pdf',
          filename: `${filePrefix}_${date}.pdf`,
        });
      });

      // Title
      doc.fontSize(16).font('Helvetica-Bold').text(title, { align: 'center' });
      doc
        .fontSize(9)
        .font('Helvetica')
        .text(
          `Diekspor: ${new Intl.DateTimeFormat('id-ID', { dateStyle: 'long' }).format(new Date())} — Total: ${rows.length} data`,
          { align: 'center' },
        );
      doc.moveDown(1);

      // Table layout
      const pageWidth =
        doc.page.width - doc.page.margins.left - doc.page.margins.right;
      const totalWidth = columns.reduce((s, c) => s + c.width, 0);
      const colWidths = columns.map((c) => (c.width / totalWidth) * pageWidth);

      // Header
      let x = doc.page.margins.left;
      const y = doc.y;
      doc.rect(x, y, pageWidth, 20).fill('#1F2937');

      doc.font('Helvetica-Bold').fontSize(8).fillColor('#FFFFFF');
      for (let i = 0; i < columns.length; i++) {
        doc.text(columns[i].header, x + 3, y + 5, {
          width: colWidths[i] - 6,
          lineBreak: false,
        });
        x += colWidths[i];
      }

      doc.y = y + 22;
      doc.fillColor('#000000').font('Helvetica').fontSize(7);

      // Data rows
      for (let r = 0; r < rows.length; r++) {
        if (doc.y > doc.page.height - 60) {
          doc.addPage();
          doc.y = doc.page.margins.top;
        }

        const rowY = doc.y;
        if (r % 2 === 0) {
          doc.rect(doc.page.margins.left, rowY, pageWidth, 16).fill('#F9FAFB');
          doc.fillColor('#000000');
        }

        x = doc.page.margins.left;
        for (let i = 0; i < columns.length; i++) {
          const val = String(rows[r][columns[i].key] ?? '-');
          doc.text(val, x + 3, rowY + 4, {
            width: colWidths[i] - 6,
            lineBreak: false,
          });
          x += colWidths[i];
        }
        doc.y = rowY + 18;
      }

      doc.end();
    });
  }
}
