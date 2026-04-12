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
} from './dto';
import { Roles } from '../../common/decorators';
import { UserRole } from '../../generated/prisma/client';
import { SkipAudit } from '../../common/decorators';

@ApiTags('Export')
@ApiBearerAuth('access-token')
@Controller('export')
@SkipAudit()
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  // ──────────────── Assets ────────────────

  @Get('assets')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN_LOGISTIK, UserRole.ADMIN_PURCHASE)
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
  @Roles(
    UserRole.SUPERADMIN,
    UserRole.ADMIN_LOGISTIK,
    UserRole.ADMIN_PURCHASE,
    UserRole.LEADER,
  )
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
  @Roles(
    UserRole.SUPERADMIN,
    UserRole.ADMIN_LOGISTIK,
    UserRole.ADMIN_PURCHASE,
    UserRole.LEADER,
  )
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
  @Roles(
    UserRole.SUPERADMIN,
    UserRole.ADMIN_LOGISTIK,
    UserRole.ADMIN_PURCHASE,
    UserRole.LEADER,
  )
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
}
