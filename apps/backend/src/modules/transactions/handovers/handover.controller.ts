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
import { HandoverService } from './handover.service';
import { CreateHandoverDto, UpdateHandoverDto, FilterHandoverDto } from './dto';
import { AuthPermissions, CurrentUser } from '../../../common/decorators';
import { PERMISSIONS } from '../../../common/constants';
import { JwtPayload } from '../../../common/interfaces';
import { UserRole } from '../../../generated/prisma/client';

@ApiTags('Handovers')
@ApiBearerAuth('access-token')
@Controller('handovers')
export class HandoverController {
  constructor(private readonly handoverService: HandoverService) {}

  @Get()
  @AuthPermissions(PERMISSIONS.HANDOVERS_VIEW)
  @ApiOperation({ summary: 'List serah terima' })
  @ApiResponse({
    status: 200,
    description: 'Berhasil mengambil data serah terima',
  })
  async findAll(
    @Query() query: FilterHandoverDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.handoverService.findAll(query, user.sub, user.role);
  }

  @Get('recommendations')
  @AuthPermissions(PERMISSIONS.ASSETS_HANDOVER)
  @ApiOperation({
    summary: 'Rekomendasi aset untuk serah terima (FIFO — oldest first)',
  })
  async getRecommendations(
    @Query('categoryId') categoryId?: string,
    @Query('typeId') typeId?: string,
    @Query('modelId') modelId?: string,
    @Query('search') search?: string,
    @Query('limit') limit?: string,
  ) {
    return this.handoverService.getRecommendations({
      categoryId: categoryId ? Number(categoryId) : undefined,
      typeId: typeId ? Number(typeId) : undefined,
      modelId: modelId ? Number(modelId) : undefined,
      search,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get(':id')
  @AuthPermissions(PERMISSIONS.HANDOVERS_VIEW)
  @ApiOperation({ summary: 'Detail serah terima' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.handoverService.findOne(id);
  }

  @Post()
  @AuthPermissions(PERMISSIONS.ASSETS_HANDOVER)
  @ApiOperation({ summary: 'Buat serah terima' })
  @ApiResponse({ status: 201, description: 'Serah terima berhasil dibuat' })
  async create(
    @Body() dto: CreateHandoverDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.handoverService.create(dto, user.sub, user.role as UserRole);
  }

  @Patch(':id')
  @AuthPermissions(PERMISSIONS.ASSETS_HANDOVER)
  @ApiOperation({ summary: 'Update serah terima' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateHandoverDto,
  ) {
    return this.handoverService.update(id, dto);
  }

  @Patch(':id/approve')
  @AuthPermissions(PERMISSIONS.ASSETS_HANDOVER)
  @ApiOperation({ summary: 'Approve serah terima' })
  async approve(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('version') version: number,
    @Body('note') note: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.handoverService.approve(
      id,
      version,
      user.sub,
      user.role as UserRole,
      user.fullName,
      note,
    );
  }

  @Patch(':id/reject')
  @AuthPermissions(PERMISSIONS.ASSETS_HANDOVER)
  @ApiOperation({ summary: 'Reject serah terima' })
  async reject(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('reason') reason: string,
    @Body('version') version: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.handoverService.reject(
      id,
      reason,
      version,
      user.sub,
      user.role as UserRole,
      user.fullName,
    );
  }

  @Patch(':id/execute')
  @AuthPermissions(PERMISSIONS.ASSETS_HANDOVER)
  @ApiOperation({ summary: 'Eksekusi serah terima' })
  async execute(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('version') version: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.handoverService.execute(id, version, user.sub);
  }

  @Patch(':id/cancel')
  @AuthPermissions(PERMISSIONS.ASSETS_HANDOVER)
  @ApiOperation({ summary: 'Batalkan serah terima' })
  async cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('version') version: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.handoverService.cancel(id, user.sub, version);
  }
}
