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
import { DismantleService } from './dismantle.service';
import {
  CreateDismantleDto,
  UpdateDismantleDto,
  FilterDismantleDto,
} from './dto';
import { Roles, CurrentUser } from '../../../common/decorators';
import { UserRole } from '../../../generated/prisma/client';
import { JwtPayload } from '../../../common/interfaces';

@ApiTags('Dismantles')
@ApiBearerAuth('access-token')
@Controller('dismantle')
export class DismantleController {
  constructor(private readonly dismantleService: DismantleService) {}

  @Get()
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN_LOGISTIK, UserRole.LEADER)
  @ApiOperation({ summary: 'List dismantle' })
  @ApiResponse({
    status: 200,
    description: 'Berhasil mengambil data dismantle',
  })
  async findAll(@Query() query: FilterDismantleDto) {
    return this.dismantleService.findAll(query);
  }

  @Get(':id')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN_LOGISTIK, UserRole.LEADER)
  @ApiOperation({ summary: 'Detail dismantle' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.dismantleService.findOne(id);
  }

  @Post()
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN_LOGISTIK)
  @ApiOperation({ summary: 'Buat dismantle' })
  @ApiResponse({ status: 201, description: 'Dismantle berhasil dibuat' })
  async create(
    @Body() dto: CreateDismantleDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.dismantleService.create(dto, user.sub);
  }

  @Patch(':id')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN_LOGISTIK)
  @ApiOperation({ summary: 'Update dismantle' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDismantleDto,
  ) {
    return this.dismantleService.update(id, dto);
  }
}
