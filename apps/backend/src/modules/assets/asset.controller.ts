import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { AssetService } from './asset.service';
import { Roles, CurrentUser } from '../../common/decorators';
import { UserRole } from '../../generated/prisma/client';
import { CreateAssetDto, UpdateAssetDto, FilterAssetDto } from './dto';

@ApiTags('Assets')
@ApiBearerAuth('access-token')
@Controller('assets')
export class AssetController {
  constructor(private readonly assetService: AssetService) {}

  @Get()
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN_LOGISTIK, UserRole.ADMIN_PURCHASE)
  @ApiOperation({ summary: 'List aset dengan pagination dan filter' })
  @ApiResponse({ status: 200, description: 'Berhasil mengambil data aset' })
  async findAll(@Query() query: FilterAssetDto) {
    return this.assetService.findAll(query);
  }

  @Get('stock')
  @ApiOperation({ summary: 'Stok aset (gudang utama / divisi / pribadi)' })
  @ApiQuery({ name: 'view', enum: ['main', 'division', 'personal'] })
  @ApiResponse({ status: 200, description: 'Data stok berhasil diambil' })
  async getStock(
    @Query('view') view: 'main' | 'division' | 'personal',
    @CurrentUser() user: { id: number; divisionId: number | null },
  ) {
    return this.assetService.getStock(view, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detail aset' })
  @ApiResponse({ status: 200, description: 'Detail aset ditemukan' })
  @ApiResponse({ status: 404, description: 'Aset tidak ditemukan' })
  async findOne(@Param('id') id: string) {
    return this.assetService.findOne(id);
  }

  @Post()
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN_LOGISTIK)
  @ApiOperation({ summary: 'Buat aset baru' })
  @ApiResponse({ status: 201, description: 'Aset berhasil dibuat' })
  async create(@Body() dto: CreateAssetDto, @CurrentUser('id') userId: number) {
    return this.assetService.create(dto, userId);
  }

  @Patch(':id')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN_LOGISTIK)
  @ApiOperation({ summary: 'Update aset' })
  @ApiResponse({ status: 200, description: 'Aset berhasil diupdate' })
  async update(@Param('id') id: string, @Body() dto: UpdateAssetDto) {
    return this.assetService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN_LOGISTIK)
  @ApiOperation({ summary: 'Soft delete aset' })
  @ApiResponse({ status: 200, description: 'Aset berhasil dihapus' })
  async remove(@Param('id') id: string) {
    return this.assetService.remove(id);
  }
}
