import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { DepreciationService } from './depreciation.service';
import {
  CreateDepreciationDto,
  UpdateDepreciationDto,
  FilterDepreciationDto,
} from './dto';
import { AuthPermissions, CurrentUser } from '../../../common/decorators';
import { PERMISSIONS } from '../../../common/constants';
import { JwtPayload } from '../../../common/interfaces';

@ApiTags('Depreciations')
@ApiBearerAuth('access-token')
@Controller('assets/depreciations')
export class DepreciationController {
  constructor(private readonly depreciationService: DepreciationService) {}

  @Get()
  @AuthPermissions(PERMISSIONS.DEPRECIATION_VIEW)
  @ApiOperation({ summary: 'List data depresiasi' })
  @ApiResponse({
    status: 200,
    description: 'Berhasil mengambil data depresiasi',
  })
  async findAll(@Query() query: FilterDepreciationDto) {
    return this.depreciationService.findAll(query);
  }

  @Get(':id')
  @AuthPermissions(PERMISSIONS.DEPRECIATION_VIEW)
  @ApiOperation({ summary: 'Detail data depresiasi' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.depreciationService.findOne(id);
  }

  @Post()
  @AuthPermissions(PERMISSIONS.DEPRECIATION_CREATE)
  @ApiOperation({ summary: 'Buat data depresiasi' })
  @ApiResponse({ status: 201, description: 'Data depresiasi berhasil dibuat' })
  async create(
    @Body() dto: CreateDepreciationDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.depreciationService.create(dto, user.sub);
  }

  @Patch(':id')
  @AuthPermissions(PERMISSIONS.DEPRECIATION_EDIT)
  @ApiOperation({ summary: 'Update data depresiasi' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDepreciationDto,
  ) {
    return this.depreciationService.update(id, dto);
  }

  @Delete(':id')
  @AuthPermissions(PERMISSIONS.DEPRECIATION_DELETE)
  @ApiOperation({ summary: 'Hapus data depresiasi' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.depreciationService.remove(id);
  }

  @Get(':id/status')
  @AuthPermissions(PERMISSIONS.DEPRECIATION_VIEW)
  @ApiOperation({ summary: 'Lihat status depresiasi saat ini' })
  @ApiResponse({
    status: 200,
    description: 'Data status depresiasi berhasil diambil',
  })
  async getDepreciationStatus(@Param('id', ParseUUIDPipe) id: string) {
    return this.depreciationService.getDepreciationStatus(id);
  }

  @Get(':id/schedule')
  @AuthPermissions(PERMISSIONS.DEPRECIATION_VIEW)
  @ApiOperation({
    summary: 'Lihat jadwal depresiasi bulanan hingga akhir umur manfaat',
  })
  @ApiResponse({
    status: 200,
    description: 'Jadwal depresiasi berhasil diambil',
  })
  async getDepreciationSchedule(@Param('id', ParseUUIDPipe) id: string) {
    const depreciation = await this.depreciationService.findOne(id);
    const purchase = depreciation.purchase;

    const schedule = this.depreciationService.generateDepreciationSchedule(
      Number(purchase.totalPrice),
      Number(depreciation.salvageValue),
      depreciation.usefulLifeYears,
      depreciation.startDate,
      depreciation.method,
    );

    return {
      depreciationId: id,
      method: depreciation.method,
      schedule,
    };
  }
}
