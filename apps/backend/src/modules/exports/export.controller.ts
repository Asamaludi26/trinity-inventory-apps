import { Controller, Get, Query, Res } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse as SwaggerResponse,
} from '@nestjs/swagger';
import { Response } from 'express';
import { ExportService } from './export.service';
import {
  ExportAssetQueryDto,
  ExportTransactionQueryDto,
  ExportCustomerQueryDto,
  ExportStockQueryDto,
} from './dto';
import { AuthPermissions } from '../../common/decorators';
import { PERMISSIONS } from '../../common/constants';
import { Throttle } from '@nestjs/throttler';
import { SkipAudit } from '../../common/decorators';

@ApiTags('Export')
@ApiBearerAuth('access-token')
@Controller('export')
@SkipAudit()
@Throttle({ default: { ttl: 60000, limit: 5 } })
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  // ──────────────── Assets ────────────────

  @Get('assets')
  @AuthPermissions(PERMISSIONS.DATA_EXPORT)
  @ApiOperation({ summary: 'Export daftar aset (XLSX/CSV/PDF)' })
  @SwaggerResponse({ status: 200, description: 'File berhasil diexport' })
  async exportAssets(
    @Query() query: ExportAssetQueryDto,
    @Res() res: Response,
  ) {
    const { buffer, contentType, filename } =
      await this.exportService.exportAssets(query);

    res.set({
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  // ──────────────── Transactions ────────────────

  @Get('requests')
  @AuthPermissions(PERMISSIONS.DATA_EXPORT)
  @ApiOperation({ summary: 'Export daftar permintaan (XLSX/CSV/PDF)' })
  @SwaggerResponse({ status: 200, description: 'File berhasil diexport' })
  async exportRequests(
    @Query() query: ExportTransactionQueryDto,
    @Res() res: Response,
  ) {
    const { buffer, contentType, filename } =
      await this.exportService.exportRequests(query);

    res.set({
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @Get('loans')
  @AuthPermissions(PERMISSIONS.DATA_EXPORT)
  @ApiOperation({ summary: 'Export daftar peminjaman (XLSX/CSV/PDF)' })
  @SwaggerResponse({ status: 200, description: 'File berhasil diexport' })
  async exportLoans(
    @Query() query: ExportTransactionQueryDto,
    @Res() res: Response,
  ) {
    const { buffer, contentType, filename } =
      await this.exportService.exportLoans(query);

    res.set({
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  // ──────────────── Customers ────────────────

  @Get('customers')
  @AuthPermissions(PERMISSIONS.DATA_EXPORT)
  @ApiOperation({ summary: 'Export daftar pelanggan (XLSX/CSV/PDF)' })
  @SwaggerResponse({ status: 200, description: 'File berhasil diexport' })
  async exportCustomers(
    @Query() query: ExportCustomerQueryDto,
    @Res() res: Response,
  ) {
    const { buffer, contentType, filename } =
      await this.exportService.exportCustomers(query);

    res.set({
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  // ──────────────── Stock Movements ────────────────

  @Get('stock')
  @AuthPermissions(PERMISSIONS.DATA_EXPORT)
  @ApiOperation({ summary: 'Export mutasi stok aset (XLSX/CSV/PDF)' })
  @SwaggerResponse({ status: 200, description: 'File berhasil diexport' })
  async exportStock(@Query() query: ExportStockQueryDto, @Res() res: Response) {
    const { buffer, contentType, filename } =
      await this.exportService.exportStock(query);

    res.set({
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  // ──────────────── Handovers ────────────────

  @Get('handovers')
  @AuthPermissions(PERMISSIONS.DATA_EXPORT)
  @ApiOperation({ summary: 'Export daftar serah terima (XLSX/CSV/PDF)' })
  @SwaggerResponse({ status: 200, description: 'File berhasil diexport' })
  async exportHandovers(
    @Query() query: ExportTransactionQueryDto,
    @Res() res: Response,
  ) {
    const { buffer, contentType, filename } =
      await this.exportService.exportHandovers(query);

    res.set({
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  // ──────────────── Repairs ────────────────

  @Get('repairs')
  @AuthPermissions(PERMISSIONS.DATA_EXPORT)
  @ApiOperation({ summary: 'Export laporan perbaikan aset (XLSX/CSV/PDF)' })
  @SwaggerResponse({ status: 200, description: 'File berhasil diexport' })
  async exportRepairs(
    @Query() query: ExportTransactionQueryDto,
    @Res() res: Response,
  ) {
    const { buffer, contentType, filename } =
      await this.exportService.exportRepairs(query);

    res.set({
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }
}
