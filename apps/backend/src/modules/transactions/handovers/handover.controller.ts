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
import { CurrentUser } from '../../../common/decorators';
import { JwtPayload } from '../../../common/interfaces';
import { UserRole } from '../../../generated/prisma/client';

@ApiTags('Handovers')
@ApiBearerAuth('access-token')
@Controller('handovers')
export class HandoverController {
  constructor(private readonly handoverService: HandoverService) {}

  @Get()
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

  @Get(':id')
  @ApiOperation({ summary: 'Detail serah terima' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.handoverService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Buat serah terima' })
  @ApiResponse({ status: 201, description: 'Serah terima berhasil dibuat' })
  async create(
    @Body() dto: CreateHandoverDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.handoverService.create(dto, user.sub, user.role as UserRole);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update serah terima' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateHandoverDto,
  ) {
    return this.handoverService.update(id, dto);
  }

  @Patch(':id/approve')
  @ApiOperation({ summary: 'Approve serah terima' })
  async approve(@Param('id', ParseUUIDPipe) id: string) {
    return this.handoverService.approve(id);
  }

  @Patch(':id/reject')
  @ApiOperation({ summary: 'Reject serah terima' })
  async reject(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('reason') reason: string,
  ) {
    return this.handoverService.reject(id, reason);
  }

  @Patch(':id/execute')
  @ApiOperation({ summary: 'Eksekusi serah terima' })
  async execute(@Param('id', ParseUUIDPipe) id: string) {
    return this.handoverService.execute(id);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Batalkan serah terima' })
  async cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.handoverService.cancel(id, user.sub);
  }
}
