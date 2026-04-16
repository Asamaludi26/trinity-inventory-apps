import {
  Controller,
  Get,
  Post,
  Patch,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { AssetService } from './asset.service';
import { AuthPermissions, CurrentUser } from '../../common/decorators';
import { PERMISSIONS } from '../../common/constants';
import {
  CreateAssetDto,
  CreateBatchAssetDto,
  UpdateAssetDto,
  QueryAssetDto,
  UpdateStockThresholdDto,
  ReportDamageDto,
  ReportLostDto,
  RestockDto,
  ThresholdBulkDto,
} from './dto';

@ApiTags('Assets')
@ApiBearerAuth('access-token')
@Controller('assets')
export class AssetController {
  constructor(private readonly assetService: AssetService) {}

  @Get()
  @AuthPermissions(PERMISSIONS.ASSETS_VIEW)
  @ApiOperation({
    summary: 'List aset dengan pagination, filter, dan dual view (group/list)',
  })
  @ApiResponse({ status: 200, description: 'Berhasil mengambil data aset' })
  async findAll(@Query() query: QueryAssetDto) {
    return this.assetService.findAll(query);
  }

  @Get('stock')
  @AuthPermissions(PERMISSIONS.STOCK_VIEW)
  @ApiOperation({ summary: 'Stok aset (gudang utama / divisi / pribadi)' })
  @ApiQuery({ name: 'view', enum: ['main', 'division', 'personal'] })
  @ApiResponse({ status: 200, description: 'Data stok berhasil diambil' })
  async getStock(
    @Query('view') view: 'main' | 'division' | 'personal',
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('search') search: string,
    @CurrentUser() user: { id: number; divisionId: number | null },
  ) {
    return this.assetService.getStock(
      view,
      user,
      Number(page) || 1,
      Number(limit) || 20,
      search || undefined,
    );
  }

  @Get('stock/:modelId/detail-total')
  @AuthPermissions(PERMISSIONS.STOCK_VIEW)
  @ApiOperation({
    summary: 'Detail total stok per model (breakdown by status & location)',
  })
  async getStockDetailTotal(@Param('modelId', ParseIntPipe) modelId: number) {
    return this.assetService.getStockDetailTotal(modelId);
  }

  @Get('stock/:modelId/detail-usage')
  @AuthPermissions(PERMISSIONS.STOCK_VIEW)
  @ApiOperation({ summary: 'Detail penggunaan stok per model' })
  async getStockDetailUsage(@Param('modelId', ParseIntPipe) modelId: number) {
    return this.assetService.getStockDetailUsage(modelId);
  }

  @Get('stock/:modelId/history')
  @AuthPermissions(PERMISSIONS.STOCK_VIEW)
  @ApiOperation({ summary: 'Riwayat stok per model' })
  async getStockHistory(
    @Param('modelId', ParseIntPipe) modelId: number,
    @Query('page') page: string,
    @Query('limit') limit: string,
  ) {
    return this.assetService.getStockHistory(
      modelId,
      Number(page) || 1,
      Number(limit) || 20,
    );
  }

  @Post('stock/:modelId/restock')
  @AuthPermissions(PERMISSIONS.STOCK_MANAGE)
  @ApiOperation({ summary: 'Restock aset per model' })
  async restock(
    @Param('modelId', ParseIntPipe) modelId: number,
    @Body() dto: RestockDto,
    @CurrentUser('id') userId: number,
  ) {
    return this.assetService.restock(modelId, dto, userId);
  }

  @Put('stock/threshold/bulk')
  @AuthPermissions(PERMISSIONS.STOCK_MANAGE)
  @ApiOperation({ summary: 'Bulk update threshold stok' })
  async updateThresholdBulk(
    @Body() dto: ThresholdBulkDto,
    @CurrentUser('id') userId: number,
  ) {
    return this.assetService.updateThresholdBulk(dto, userId);
  }

  @Get(':id')
  @AuthPermissions(PERMISSIONS.ASSETS_VIEW)
  @ApiOperation({ summary: 'Detail aset dengan semua relasi' })
  @ApiResponse({ status: 200, description: 'Detail aset ditemukan' })
  @ApiResponse({ status: 404, description: 'Aset tidak ditemukan' })
  async findOne(@Param('id') id: string) {
    return this.assetService.findOne(id);
  }

  @Get(':id/history')
  @AuthPermissions(PERMISSIONS.ASSETS_VIEW)
  @ApiOperation({ summary: 'Riwayat perubahan aset' })
  async getAssetHistory(
    @Param('id') id: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
  ) {
    return this.assetService.getAssetHistory(
      id,
      Number(page) || 1,
      Number(limit) || 20,
    );
  }

  @Post()
  @AuthPermissions(PERMISSIONS.ASSETS_CREATE)
  @ApiOperation({ summary: 'Buat aset baru' })
  @ApiResponse({ status: 201, description: 'Aset berhasil dibuat' })
  async create(@Body() dto: CreateAssetDto, @CurrentUser('id') userId: number) {
    return this.assetService.create(dto, userId);
  }

  @Post('batch')
  @AuthPermissions(PERMISSIONS.ASSETS_CREATE)
  @ApiOperation({
    summary: 'Registrasi batch aset (multiple items dalam 1 transaksi)',
  })
  @ApiResponse({ status: 201, description: 'Batch aset berhasil dibuat' })
  async createBatch(
    @Body() dto: CreateBatchAssetDto,
    @CurrentUser('id') userId: number,
  ) {
    return this.assetService.createBatch(dto, userId);
  }

  @Post(':id/report-damage')
  @AuthPermissions(PERMISSIONS.ASSETS_REPAIR_REPORT)
  @ApiOperation({ summary: 'Lapor kerusakan aset (individual only)' })
  async reportDamage(
    @Param('id') id: string,
    @Body() dto: ReportDamageDto,
    @CurrentUser('id') userId: number,
  ) {
    return this.assetService.reportDamage(id, dto, userId);
  }

  @Post(':id/report-lost')
  @AuthPermissions(PERMISSIONS.ASSETS_REPAIR_REPORT)
  @ApiOperation({ summary: 'Lapor aset hilang' })
  async reportLost(
    @Param('id') id: string,
    @Body() dto: ReportLostDto,
    @CurrentUser('id') userId: number,
  ) {
    return this.assetService.reportLost(id, dto, userId);
  }

  @Patch(':id')
  @AuthPermissions(PERMISSIONS.ASSETS_EDIT)
  @ApiOperation({ summary: 'Update aset (partial)' })
  @ApiResponse({ status: 200, description: 'Aset berhasil diupdate' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateAssetDto,
    @Body('version') version: number,
  ) {
    return this.assetService.update(id, dto, version);
  }

  @Delete(':id')
  @AuthPermissions(PERMISSIONS.ASSETS_DELETE)
  @ApiOperation({ summary: 'Safe delete aset (cek relasi sebelum hapus)' })
  @ApiResponse({ status: 200, description: 'Aset berhasil dihapus' })
  async remove(@Param('id') id: string) {
    return this.assetService.remove(id);
  }

  @Put('models/:modelId/threshold')
  @AuthPermissions(PERMISSIONS.STOCK_MANAGE)
  @ApiOperation({ summary: 'Set/update threshold stok minimum per model' })
  @ApiResponse({ status: 200, description: 'Threshold berhasil diupdate' })
  async updateStockThreshold(
    @Param('modelId', ParseIntPipe) modelId: number,
    @Body() dto: UpdateStockThresholdDto,
    @CurrentUser('id') userId: number,
  ) {
    return this.assetService.updateStockThreshold(
      modelId,
      dto.minQuantity,
      dto.warningQuantity,
      userId,
    );
  }
}
