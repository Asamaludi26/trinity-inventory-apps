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
  FilterAssetDto,
  UpdateStockThresholdDto,
} from './dto';

@ApiTags('Assets')
@ApiBearerAuth('access-token')
@Controller('assets')
export class AssetController {
  constructor(private readonly assetService: AssetService) {}

  @Get()
  @AuthPermissions(PERMISSIONS.ASSETS_VIEW)
  @ApiOperation({ summary: 'List aset dengan pagination dan filter' })
  @ApiResponse({ status: 200, description: 'Berhasil mengambil data aset' })
  async findAll(@Query() query: FilterAssetDto) {
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

  @Get(':id')
  @AuthPermissions(PERMISSIONS.ASSETS_VIEW)
  @ApiOperation({ summary: 'Detail aset' })
  @ApiResponse({ status: 200, description: 'Detail aset ditemukan' })
  @ApiResponse({ status: 404, description: 'Aset tidak ditemukan' })
  async findOne(@Param('id') id: string) {
    return this.assetService.findOne(id);
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

  @Patch(':id')
  @AuthPermissions(PERMISSIONS.ASSETS_EDIT)
  @ApiOperation({ summary: 'Update aset' })
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
  @ApiOperation({ summary: 'Soft delete aset' })
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
      userId,
    );
  }
}
