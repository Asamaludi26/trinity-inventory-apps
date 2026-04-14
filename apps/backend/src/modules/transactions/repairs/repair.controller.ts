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
    @Body('note') note: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.repairService.approve(
      id,
      version,
      user.sub,
      user.role as UserRole,
      user.fullName,
      note,
    );
  }

  @Patch(':id/reject')
  @AuthPermissions(PERMISSIONS.ASSETS_REPAIR_MANAGE)
  @ApiOperation({ summary: 'Reject laporan perbaikan' })
  async reject(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('reason') reason: string,
    @Body('version') version: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.repairService.reject(
      id,
      reason,
      version,
      user.sub,
      user.role as UserRole,
      user.fullName,
    );
  }

  @Patch(':id/execute')
  @AuthPermissions(PERMISSIONS.ASSETS_REPAIR_MANAGE)
  @ApiOperation({ summary: 'Eksekusi perbaikan (mulai perbaikan)' })
  async execute(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('version') version: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.repairService.execute(id, version, user.sub);
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
    @CurrentUser() user: JwtPayload,
  ) {
    const { version, ...repairData } = data;
    return this.repairService.complete(id, repairData, version, user.sub);
  }

  @Patch(':id/send-out')
  @AuthPermissions(PERMISSIONS.ASSETS_REPAIR_MANAGE)
  @ApiOperation({ summary: 'Kirim aset ke service center eksternal' })
  async sendOutForRepair(
    @Param('id', ParseUUIDPipe) id: string,
    @Body()
    data: {
      repairVendor: string;
      note?: string;
      version: number;
    },
    @CurrentUser() user: JwtPayload,
  ) {
    const { version, ...repairData } = data;
    return this.repairService.sendOutForRepair(
      id,
      repairData,
      version,
      user.sub,
    );
  }

  @Patch(':id/decommission')
  @AuthPermissions(PERMISSIONS.ASSETS_REPAIR_MANAGE)
  @ApiOperation({ summary: 'Decommission aset yang tidak dapat diperbaiki' })
  async decommission(
    @Param('id', ParseUUIDPipe) id: string,
    @Body()
    data: {
      repairAction?: string;
      note?: string;
      version: number;
    },
    @CurrentUser() user: JwtPayload,
  ) {
    const { version, ...repairData } = data;
    return this.repairService.decommission(id, repairData, version, user.sub);
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

  @Post('report-lost')
  @AuthPermissions(PERMISSIONS.ASSETS_REPAIR_REPORT)
  @ApiOperation({ summary: 'Lapor aset hilang (bypass approval)' })
  @ApiResponse({
    status: 201,
    description: 'Laporan aset hilang berhasil dibuat',
  })
  async reportLost(
    @Body()
    dto: {
      assetId: string;
      description: string;
      note?: string;
    },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.repairService.reportLost(dto, user.sub);
  }

  @Patch(':id/resolve-lost')
  @AuthPermissions(PERMISSIONS.ASSETS_REPAIR_MANAGE)
  @ApiOperation({
    summary: 'Resolve laporan aset hilang (ditemukan/tidak ditemukan)',
  })
  async resolveLost(
    @Param('id', ParseUUIDPipe) id: string,
    @Body()
    data: {
      resolution: 'FOUND' | 'NOT_FOUND';
      note?: string;
      version: number;
    },
    @CurrentUser() user: JwtPayload,
  ) {
    const { version, ...resolveData } = data;
    return this.repairService.resolveLost(id, resolveData, version, user.sub);
  }
}
