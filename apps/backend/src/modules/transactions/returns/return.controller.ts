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
import { ReturnService } from './return.service';
import { CreateReturnDto, UpdateReturnDto, FilterReturnDto } from './dto';
import { AuthPermissions, CurrentUser } from '../../../common/decorators';
import { PERMISSIONS } from '../../../common/constants';
import { JwtPayload } from '../../../common/interfaces';
import { UserRole } from '../../../generated/prisma/client';

@ApiTags('Returns')
@ApiBearerAuth('access-token')
@Controller('returns')
export class ReturnController {
  constructor(private readonly returnService: ReturnService) {}

  @Get()
  @AuthPermissions(PERMISSIONS.RETURNS_VIEW)
  @ApiOperation({ summary: 'List pengembalian aset' })
  @ApiResponse({
    status: 200,
    description: 'Berhasil mengambil data pengembalian',
  })
  async findAll(
    @Query() query: FilterReturnDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.returnService.findAll(query, user.sub, user.role);
  }

  @Get(':id')
  @AuthPermissions(PERMISSIONS.RETURNS_VIEW)
  @ApiOperation({ summary: 'Detail pengembalian' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.returnService.findOne(id);
  }

  @Post()
  @AuthPermissions(PERMISSIONS.RETURNS_CREATE)
  @ApiOperation({ summary: 'Buat pengembalian' })
  @ApiResponse({ status: 201, description: 'Pengembalian berhasil dibuat' })
  async create(@Body() dto: CreateReturnDto, @CurrentUser() user: JwtPayload) {
    return this.returnService.create(dto, user.sub);
  }

  @Patch(':id')
  @AuthPermissions(PERMISSIONS.RETURNS_CREATE)
  @ApiOperation({ summary: 'Update pengembalian' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateReturnDto,
  ) {
    return this.returnService.update(id, dto);
  }

  @Patch(':id/approve')
  @AuthPermissions(PERMISSIONS.RETURNS_APPROVE)
  @ApiOperation({ summary: 'Approve pengembalian' })
  async approve(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('version') version: number,
    @Body('note') note: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.returnService.approve(
      id,
      version,
      user.sub,
      user.role as UserRole,
      user.fullName,
      note,
    );
  }

  @Patch(':id/reject')
  @AuthPermissions(PERMISSIONS.RETURNS_APPROVE)
  @ApiOperation({ summary: 'Reject pengembalian' })
  async reject(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('reason') reason: string,
    @Body('version') version: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.returnService.reject(
      id,
      reason,
      version,
      user.sub,
      user.role as UserRole,
      user.fullName,
    );
  }

  @Patch(':id/execute')
  @AuthPermissions(PERMISSIONS.RETURNS_APPROVE)
  @ApiOperation({ summary: 'Eksekusi pengembalian' })
  async execute(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('version') version: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.returnService.execute(id, version, user.sub);
  }

  @Patch(':id/cancel')
  @AuthPermissions(PERMISSIONS.RETURNS_CREATE)
  @ApiOperation({ summary: 'Batalkan pengembalian' })
  async cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('version') version: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.returnService.cancel(id, user.sub, version);
  }
}
