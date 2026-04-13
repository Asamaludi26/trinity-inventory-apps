import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import * as ExcelJS from 'exceljs';
import { Readable } from 'stream';

export interface ImportResult {
  totalRows: number;
  successCount: number;
  errorCount: number;
  errors: Array<{ row: number; field: string; message: string }>;
}

export interface ImportPreviewRow {
  row: number;
  code: string;
  name: string;
  category: string;
  brand: string;
  serialNumber: string | null;
}

export interface ImportPreviewResult {
  totalRows: number;
  validCount: number;
  errorCount: number;
  errors: Array<{ row: number; field: string; message: string }>;
  rows: ImportPreviewRow[];
}

@Injectable()
export class ImportService {
  private readonly logger = new Logger(ImportService.name);

  constructor(private readonly prisma: PrismaService) {}

  async importAssets(
    file: Express.Multer.File,
    createdById: number,
  ): Promise<ImportResult> {
    if (!file) {
      throw new BadRequestException('File tidak ditemukan');
    }

    const ext = file.originalname.split('.').pop()?.toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(ext ?? '')) {
      throw new BadRequestException(
        'Format file tidak didukung. Gunakan XLSX, XLS, atau CSV.',
      );
    }

    const workbook = new ExcelJS.Workbook();

    if (ext === 'csv') {
      const stream = new Readable();
      stream.push(file.buffer);
      stream.push(null);
      await workbook.csv.read(stream);
    } else {
      // @ts-expect-error Buffer generic type mismatch between @types/node v22+ and exceljs
      await workbook.xlsx.load(file.buffer);
    }

    const sheet = workbook.worksheets[0];
    if (!sheet || sheet.rowCount < 2) {
      throw new BadRequestException(
        'File kosong atau tidak memiliki data. Baris pertama harus header.',
      );
    }

    // Parse header row to map columns
    const headerRow = sheet.getRow(1);
    const headerMap = new Map<string, number>();
    headerRow.eachCell((cell, colNumber) => {
      const val = String(cell.value ?? '')
        .trim()
        .toLowerCase();
      headerMap.set(val, colNumber);
    });

    // Required columns validation
    const requiredHeaders = ['kode', 'nama aset', 'kategori', 'brand'];
    const missingHeaders = requiredHeaders.filter((h) => !headerMap.has(h));
    if (missingHeaders.length > 0) {
      throw new BadRequestException(
        `Kolom wajib tidak ditemukan: ${missingHeaders.join(', ')}. Pastikan header sesuai template.`,
      );
    }

    // Cache categories for lookup
    const categories = await this.prisma.assetCategory.findMany({
      where: { isDeleted: false },
    });
    const categoryMap = new Map(
      categories.map((c) => [c.name.toLowerCase(), c.id]),
    );

    const result: ImportResult = {
      totalRows: 0,
      successCount: 0,
      errorCount: 0,
      errors: [],
    };

    const assetsToCreate: Array<{
      code: string;
      name: string;
      categoryId: number;
      brand: string;
      serialNumber: string | null;
      recordedById: number;
    }> = [];

    const getCell = (row: ExcelJS.Row, header: string): string => {
      const colNum = headerMap.get(header);
      if (!colNum) return '';
      return String(row.getCell(colNum).value ?? '').trim();
    };

    // Process data rows
    for (let rowNum = 2; rowNum <= sheet.rowCount; rowNum++) {
      const row = sheet.getRow(rowNum);

      // Skip empty rows
      const code = getCell(row, 'kode');
      if (!code) continue;

      result.totalRows++;

      const name = getCell(row, 'nama aset');
      const categoryName = getCell(row, 'kategori');
      const brand = getCell(row, 'brand');
      const serialNumber = getCell(row, 's/n') || null;

      // Validate required fields
      if (!name) {
        result.errors.push({
          row: rowNum,
          field: 'Nama Aset',
          message: 'Nama aset wajib diisi',
        });
        result.errorCount++;
        continue;
      }

      if (!categoryName) {
        result.errors.push({
          row: rowNum,
          field: 'Kategori',
          message: 'Kategori wajib diisi',
        });
        result.errorCount++;
        continue;
      }

      const categoryId = categoryMap.get(categoryName.toLowerCase());
      if (!categoryId) {
        result.errors.push({
          row: rowNum,
          field: 'Kategori',
          message: `Kategori "${categoryName}" tidak ditemukan`,
        });
        result.errorCount++;
        continue;
      }

      if (!brand) {
        result.errors.push({
          row: rowNum,
          field: 'Brand',
          message: 'Brand wajib diisi',
        });
        result.errorCount++;
        continue;
      }

      assetsToCreate.push({
        code,
        name,
        categoryId,
        brand,
        serialNumber,
        recordedById: createdById,
      });
    }

    // Batch insert with duplicate handling
    if (assetsToCreate.length > 0) {
      // Check for duplicate codes in DB
      const existingCodes = await this.prisma.asset.findMany({
        where: {
          code: { in: assetsToCreate.map((a) => a.code) },
        },
        select: { code: true },
      });
      const existingCodeSet = new Set(existingCodes.map((a) => a.code));

      const uniqueAssets = assetsToCreate.filter((a) => {
        if (existingCodeSet.has(a.code)) {
          result.errors.push({
            row: 0,
            field: 'Kode',
            message: `Kode "${a.code}" sudah ada di database`,
          });
          result.errorCount++;
          return false;
        }
        return true;
      });

      // Check for duplicate codes within the file
      const seenCodes = new Set<string>();
      const dedupedAssets = uniqueAssets.filter((a) => {
        if (seenCodes.has(a.code)) {
          result.errors.push({
            row: 0,
            field: 'Kode',
            message: `Kode "${a.code}" duplikat dalam file`,
          });
          result.errorCount++;
          return false;
        }
        seenCodes.add(a.code);
        return true;
      });

      if (dedupedAssets.length > 0) {
        try {
          await this.prisma.asset.createMany({
            data: dedupedAssets,
            skipDuplicates: true,
          });
          result.successCount = dedupedAssets.length;
        } catch (error) {
          this.logger.error('Import failed', error);
          throw new BadRequestException(
            'Gagal menyimpan data. Periksa format file.',
          );
        }
      }
    }

    return result;
  }

  async previewAssets(file: Express.Multer.File): Promise<ImportPreviewResult> {
    if (!file) {
      throw new BadRequestException('File tidak ditemukan');
    }

    const ext = file.originalname.split('.').pop()?.toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(ext ?? '')) {
      throw new BadRequestException(
        'Format file tidak didukung. Gunakan XLSX, XLS, atau CSV.',
      );
    }

    const workbook = new ExcelJS.Workbook();
    if (ext === 'csv') {
      const stream = new Readable();
      stream.push(file.buffer);
      stream.push(null);
      await workbook.csv.read(stream);
    } else {
      // @ts-expect-error Buffer generic type mismatch between @types/node v22+ and exceljs
      await workbook.xlsx.load(file.buffer);
    }

    const sheet = workbook.worksheets[0];
    if (!sheet || sheet.rowCount < 2) {
      throw new BadRequestException(
        'File kosong atau tidak memiliki data. Baris pertama harus header.',
      );
    }

    const headerRow = sheet.getRow(1);
    const headerMap = new Map<string, number>();
    headerRow.eachCell((cell, colNumber) => {
      const val = String(cell.value ?? '')
        .trim()
        .toLowerCase();
      headerMap.set(val, colNumber);
    });

    const requiredHeaders = ['kode', 'nama aset', 'kategori', 'brand'];
    const missingHeaders = requiredHeaders.filter((h) => !headerMap.has(h));
    if (missingHeaders.length > 0) {
      throw new BadRequestException(
        `Kolom wajib tidak ditemukan: ${missingHeaders.join(', ')}. Pastikan header sesuai template.`,
      );
    }

    const categories = await this.prisma.assetCategory.findMany({
      where: { isDeleted: false },
    });
    const categoryMap = new Map(
      categories.map((c) => [c.name.toLowerCase(), c.id]),
    );

    const result: ImportPreviewResult = {
      totalRows: 0,
      validCount: 0,
      errorCount: 0,
      errors: [],
      rows: [],
    };

    const getCell = (row: ExcelJS.Row, header: string): string => {
      const colNum = headerMap.get(header);
      if (!colNum) return '';
      return String(row.getCell(colNum).value ?? '').trim();
    };

    for (let rowNum = 2; rowNum <= sheet.rowCount; rowNum++) {
      const row = sheet.getRow(rowNum);
      const code = getCell(row, 'kode');
      if (!code) continue;

      result.totalRows++;

      const name = getCell(row, 'nama aset');
      const categoryName = getCell(row, 'kategori');
      const brand = getCell(row, 'brand');
      const serialNumber = getCell(row, 's/n') || null;

      if (!name) {
        result.errors.push({
          row: rowNum,
          field: 'Nama Aset',
          message: 'Nama aset wajib diisi',
        });
        result.errorCount++;
        continue;
      }
      if (!categoryName) {
        result.errors.push({
          row: rowNum,
          field: 'Kategori',
          message: 'Kategori wajib diisi',
        });
        result.errorCount++;
        continue;
      }
      if (!categoryMap.get(categoryName.toLowerCase())) {
        result.errors.push({
          row: rowNum,
          field: 'Kategori',
          message: `Kategori "${categoryName}" tidak ditemukan`,
        });
        result.errorCount++;
        continue;
      }
      if (!brand) {
        result.errors.push({
          row: rowNum,
          field: 'Brand',
          message: 'Brand wajib diisi',
        });
        result.errorCount++;
        continue;
      }

      result.rows.push({
        row: rowNum,
        code,
        name,
        category: categoryName,
        brand,
        serialNumber,
      });
      result.validCount++;
    }

    return result;
  }

  async getImportTemplate(): Promise<{
    buffer: Buffer;
    contentType: string;
    filename: string;
  }> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Trinity Inventory';

    const sheet = workbook.addWorksheet('Template Import Aset');

    sheet.columns = [
      { header: 'Kode', key: 'code', width: 15 },
      { header: 'Nama Aset', key: 'name', width: 25 },
      { header: 'Kategori', key: 'category', width: 18 },
      { header: 'Brand', key: 'brand', width: 15 },
      { header: 'S/N', key: 'serialNumber', width: 20 },
    ];

    // Style header
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1F2937' },
    };
    headerRow.height = 28;

    // Add sample data
    sheet.addRow({
      code: 'AST-001',
      name: 'Laptop Asus ROG',
      category: 'Elektronik',
      brand: 'Asus',
      serialNumber: 'SN-12345',
    });
    sheet.addRow({
      code: 'AST-002',
      name: 'Meja Kerja',
      category: 'Furnitur',
      brand: 'IKEA',
      serialNumber: '',
    });

    // Add instruction sheet
    const infoSheet = workbook.addWorksheet('Petunjuk');
    infoSheet.getColumn(1).width = 20;
    infoSheet.getColumn(2).width = 50;
    infoSheet.addRow(['Kolom', 'Keterangan']);
    infoSheet.addRow(['Kode', 'Wajib. Kode unik aset (misal: AST-001)']);
    infoSheet.addRow(['Nama Aset', 'Wajib. Nama lengkap aset']);
    infoSheet.addRow([
      'Kategori',
      'Wajib. Harus sesuai kategori yang sudah ada di sistem',
    ]);
    infoSheet.addRow(['Brand', 'Wajib. Merek/brand aset']);
    infoSheet.addRow(['S/N', 'Opsional. Serial number aset']);

    const infoHeader = infoSheet.getRow(1);
    infoHeader.font = { bold: true };

    // List available categories
    const categories = await this.prisma.assetCategory.findMany({
      where: { isDeleted: false },
      select: { name: true },
      orderBy: { name: 'asc' },
    });
    infoSheet.addRow([]);
    infoSheet.addRow(['Kategori yang tersedia:']);
    for (const cat of categories) {
      infoSheet.addRow(['', cat.name]);
    }

    const buffer = Buffer.from(await workbook.xlsx.writeBuffer());

    return {
      buffer,
      contentType:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      filename: 'template_import_aset.xlsx',
    };
  }
}
