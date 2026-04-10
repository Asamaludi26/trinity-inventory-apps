import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { AssetService } from './asset.service';
import { PaginationQueryDto } from '../../common/dto';
import { Roles, CurrentUser } from '../../common/decorators';
import { UserRole } from '../../generated/prisma/client';
import { CreateAssetDto } from './dto/create-asset.dto';

@Controller('api/v1/assets')
export class AssetController {
  constructor(private readonly assetService: AssetService) {}

  @Get()
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN_LOGISTIK, UserRole.ADMIN_PURCHASE)
  async findAll(@Query() query: PaginationQueryDto) {
    return this.assetService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.assetService.findOne(id);
  }

  @Post()
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN_LOGISTIK)
  async create(@Body() dto: CreateAssetDto, @CurrentUser('id') userId: number) {
    return this.assetService.create(dto, userId);
  }
}
