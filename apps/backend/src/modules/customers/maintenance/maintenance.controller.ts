import {
  Controller,
  Get,
  Post,
  Patch,
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
import { MaintenanceService } from './maintenance.service';
import {
  CreateMaintenanceDto,
  UpdateMaintenanceDto,
  FilterMaintenanceDto,
} from './dto';
import { AuthPermissions, CurrentUser } from '../../../common/decorators';
import { PERMISSIONS } from '../../../common/constants';
import { JwtPayload } from '../../../common/interfaces';

@ApiTags('Maintenance')
@ApiBearerAuth('access-token')
@Controller('maintenance')
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  @Get()
  @AuthPermissions(PERMISSIONS.MAINTENANCES_VIEW)
  @ApiOperation({ summary: 'List maintenance' })
  @ApiResponse({
    status: 200,
    description: 'Berhasil mengambil data maintenance',
  })
  async findAll(@Query() query: FilterMaintenanceDto) {
    return this.maintenanceService.findAll(query);
  }

  @Get(':id')
  @AuthPermissions(PERMISSIONS.MAINTENANCES_VIEW)
  @ApiOperation({ summary: 'Detail maintenance' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.maintenanceService.findOne(id);
  }

  @Post()
  @AuthPermissions(PERMISSIONS.MAINTENANCES_CREATE)
  @ApiOperation({ summary: 'Buat maintenance' })
  @ApiResponse({ status: 201, description: 'Maintenance berhasil dibuat' })
  async create(
    @Body() dto: CreateMaintenanceDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.maintenanceService.create(dto, user.sub);
  }

  @Patch(':id')
  @AuthPermissions(PERMISSIONS.MAINTENANCES_CREATE)
  @ApiOperation({ summary: 'Update maintenance' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMaintenanceDto,
  ) {
    return this.maintenanceService.update(id, dto);
  }

  @Patch(':id/complete')
  @AuthPermissions(PERMISSIONS.MAINTENANCES_CREATE)
  @ApiOperation({ summary: 'Selesaikan maintenance — deduksi stok material' })
  @ApiResponse({
    status: 200,
    description: 'Maintenance berhasil diselesaikan',
  })
  async complete(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.maintenanceService.complete(id, user.sub);
  }
}
