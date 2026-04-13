import {
  Controller,
  Get,
  Post,
  Patch,
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
} from '@nestjs/swagger';
import { AssetTypeService } from './asset-type.service';
import {
  CreateAssetTypeDto,
  UpdateAssetTypeDto,
  FilterAssetTypeDto,
} from './dto';
import { AuthPermissions } from '../../../common/decorators';
import { PERMISSIONS } from '../../../common/constants';

@ApiTags('Asset Types')
@ApiBearerAuth('access-token')
@Controller('assets/types')
export class AssetTypeController {
  constructor(private readonly assetTypeService: AssetTypeService) {}

  @Get()
  @AuthPermissions(PERMISSIONS.CATEGORIES_VIEW)
  @ApiOperation({ summary: 'List tipe aset' })
  @ApiResponse({ status: 200, description: 'Berhasil mengambil data tipe' })
  async findAll(@Query() query: FilterAssetTypeDto) {
    return this.assetTypeService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detail tipe aset' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.assetTypeService.findOne(id);
  }

  @Post()
  @AuthPermissions(PERMISSIONS.CATEGORIES_MANAGE)
  @ApiOperation({ summary: 'Buat tipe aset' })
  @ApiResponse({ status: 201, description: 'Tipe berhasil dibuat' })
  async create(@Body() dto: CreateAssetTypeDto) {
    return this.assetTypeService.create(dto);
  }

  @Patch(':id')
  @AuthPermissions(PERMISSIONS.CATEGORIES_MANAGE)
  @ApiOperation({ summary: 'Update tipe aset' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAssetTypeDto,
  ) {
    return this.assetTypeService.update(id, dto);
  }

  @Delete(':id')
  @AuthPermissions(PERMISSIONS.CATEGORIES_MANAGE)
  @ApiOperation({ summary: 'Hapus tipe aset' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.assetTypeService.remove(id);
  }
}
