import {
  Controller,
  Get,
  Post,
  Patch,
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
import { RepairService } from './repair.service';
import { CreateRepairDto, UpdateRepairDto, FilterRepairDto } from './dto';
import { AuthPermissions, CurrentUser } from '../../../common/decorators';
import { PERMISSIONS } from '../../../common/constants';
import { JwtPayload } from '../../../common/interfaces';
import { UserRole } from '../../../generated/prisma/client';

@ApiTags('Repairs')
@ApiBearerAuth('access-token')
@Controller('repairs')
export class RepairController {
  constructor(private readonly repairService: RepairService) {}

  @Get()
  @AuthPermissions(PERMISSIONS.ASSETS_REPAIR_REPORT)
  @ApiOperation({ summary: 'List laporan perbaikan' })
  @ApiResponse({
    status: 200,
    description: 'Berhasil mengambil data perbaikan',
  })
  async findAll(
    @Query() query: FilterRepairDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.repairService.findAll(query, user.sub, user.role);
  }

  @Get(':id')
  @AuthPermissions(PERMISSIONS.ASSETS_REPAIR_REPORT)
  @ApiOperation({ summary: 'Detail laporan perbaikan' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.repairService.findOne(id);
  }

  @Post()
  @AuthPermissions(PERMISSIONS.ASSETS_REPAIR_REPORT)
  @ApiOperation({ summary: 'Buat laporan perbaikan' })
  @ApiResponse({
    status: 201,
    description: 'Laporan perbaikan berhasil dibuat',
  })
  async create(@Body() dto: CreateRepairDto, @CurrentUser() user: JwtPayload) {
    return this.repairService.create(dto, user.sub, user.role as UserRole);
  }

  @Patch(':id')
  @AuthPermissions(PERMISSIONS.ASSETS_REPAIR_MANAGE)
  @ApiOperation({ summary: 'Update laporan perbaikan' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRepairDto,
  ) {
    return this.repairService.update(id, dto);
  }

  @Patch(':id/approve')
  @AuthPermissions(PERMISSIONS.ASSETS_REPAIR_MANAGE)
  @ApiOperation({ summary: 'Approve laporan perbaikan' })
  async approve(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('version') version: number,
  ) {
    return this.repairService.approve(id, version);
  }

  @Patch(':id/reject')
  @AuthPermissions(PERMISSIONS.ASSETS_REPAIR_MANAGE)
  @ApiOperation({ summary: 'Reject laporan perbaikan' })
  async reject(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('reason') reason: string,
    @Body('version') version: number,
  ) {
    return this.repairService.reject(id, reason, version);
  }

  @Patch(':id/execute')
  @AuthPermissions(PERMISSIONS.ASSETS_REPAIR_MANAGE)
  @ApiOperation({ summary: 'Eksekusi perbaikan (mulai perbaikan)' })
  async execute(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('version') version: number,
  ) {
    return this.repairService.execute(id, version);
  }

  @Patch(':id/complete')
  @AuthPermissions(PERMISSIONS.ASSETS_REPAIR_MANAGE)
  @ApiOperation({ summary: 'Selesaikan perbaikan' })
  async complete(
    @Param('id', ParseUUIDPipe) id: string,
    @Body()
    data: {
      repairAction?: string;
      repairVendor?: string;
      repairCost?: number;
      version: number;
    },
  ) {
    const { version, ...repairData } = data;
    return this.repairService.complete(id, repairData, version);
  }

  @Patch(':id/cancel')
  @AuthPermissions(PERMISSIONS.ASSETS_REPAIR_REPORT)
  @ApiOperation({ summary: 'Batalkan laporan perbaikan' })
  async cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('version') version: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.repairService.cancel(id, user.sub, version);
  }
}
