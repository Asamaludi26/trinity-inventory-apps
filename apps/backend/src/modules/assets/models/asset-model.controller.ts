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
import { AssetModelService } from './asset-model.service';
import {
  CreateAssetModelDto,
  UpdateAssetModelDto,
  FilterAssetModelDto,
} from './dto';
import { AuthPermissions } from '../../../common/decorators';
import { PERMISSIONS } from '../../../common/constants';

@ApiTags('Asset Models')
@ApiBearerAuth('access-token')
@Controller('assets/models')
export class AssetModelController {
  constructor(private readonly assetModelService: AssetModelService) {}

  @Get()
  @AuthPermissions(PERMISSIONS.CATEGORIES_VIEW)
  @ApiOperation({ summary: 'List model aset' })
  @ApiResponse({ status: 200, description: 'Berhasil mengambil data model' })
  async findAll(@Query() query: FilterAssetModelDto) {
    return this.assetModelService.findAll(query);
  }

  @Get(':id')
  @AuthPermissions(PERMISSIONS.CATEGORIES_VIEW)
  @ApiOperation({ summary: 'Detail model aset' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.assetModelService.findOne(id);
  }

  @Post()
  @AuthPermissions(PERMISSIONS.CATEGORIES_MANAGE)
  @ApiOperation({ summary: 'Buat model aset' })
  @ApiResponse({ status: 201, description: 'Model berhasil dibuat' })
  async create(@Body() dto: CreateAssetModelDto) {
    return this.assetModelService.create(dto);
  }

  @Patch(':id')
  @AuthPermissions(PERMISSIONS.CATEGORIES_MANAGE)
  @ApiOperation({ summary: 'Update model aset' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAssetModelDto,
  ) {
    return this.assetModelService.update(id, dto);
  }

  @Delete(':id')
  @AuthPermissions(PERMISSIONS.CATEGORIES_MANAGE)
  @ApiOperation({ summary: 'Hapus model aset (soft delete)' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.assetModelService.remove(id);
  }
}
