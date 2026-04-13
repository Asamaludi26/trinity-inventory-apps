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
import { RequestService } from './request.service';
import {
  CreateRequestDto,
  UpdateRequestDto,
  FilterRequestDto,
  ApproveRequestDto,
} from './dto';
import { AuthPermissions, CurrentUser } from '../../../common/decorators';
import { PERMISSIONS } from '../../../common/constants';
import { JwtPayload } from '../../../common/interfaces';
import { UserRole } from '../../../generated/prisma/client';

@ApiTags('Requests')
@ApiBearerAuth('access-token')
@Controller('requests')
export class RequestController {
  constructor(private readonly requestService: RequestService) {}

  @Get()
  @AuthPermissions(PERMISSIONS.REQUESTS_VIEW_ALL)
  @ApiOperation({ summary: 'List permintaan barang' })
  @ApiResponse({
    status: 200,
    description: 'Berhasil mengambil data permintaan',
  })
  async findAll(
    @Query() query: FilterRequestDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.requestService.findAll(query, user.sub, user.role);
  }

  @Get(':id')
  @AuthPermissions(PERMISSIONS.REQUESTS_VIEW_OWN)
  @ApiOperation({ summary: 'Detail permintaan barang' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.requestService.findOne(id);
  }

  @Post()
  @AuthPermissions(PERMISSIONS.REQUESTS_CREATE)
  @ApiOperation({ summary: 'Buat permintaan barang' })
  @ApiResponse({ status: 201, description: 'Permintaan berhasil dibuat' })
  async create(@Body() dto: CreateRequestDto, @CurrentUser() user: JwtPayload) {
    return this.requestService.create(dto, user.sub, user.role as UserRole);
  }

  @Patch(':id')
  @AuthPermissions(PERMISSIONS.REQUESTS_CREATE)
  @ApiOperation({ summary: 'Update permintaan barang' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRequestDto,
  ) {
    return this.requestService.update(id, dto);
  }

  @Patch(':id/approve')
  @AuthPermissions(PERMISSIONS.REQUESTS_APPROVE_LOGISTIC)
  @ApiOperation({ summary: 'Approve permintaan barang' })
  async approve(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ApproveRequestDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.requestService.approve(
      id,
      dto.version,
      user.sub,
      user.role as UserRole,
      user.fullName,
      dto.note,
      dto.itemAdjustments,
    );
  }

  @Patch(':id/reject')
  @AuthPermissions(PERMISSIONS.REQUESTS_APPROVE_LOGISTIC)
  @ApiOperation({ summary: 'Reject permintaan barang' })
  async reject(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('reason') reason: string,
    @Body('version') version: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.requestService.reject(
      id,
      reason,
      version,
      user.sub,
      user.role as UserRole,
      user.fullName,
    );
  }

  @Patch(':id/execute')
  @AuthPermissions(PERMISSIONS.REQUESTS_APPROVE_LOGISTIC)
  @ApiOperation({ summary: 'Eksekusi permintaan barang' })
  async execute(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('version') version: number,
  ) {
    return this.requestService.execute(id, version);
  }

  @Patch(':id/cancel')
  @AuthPermissions(PERMISSIONS.REQUESTS_CANCEL_OWN)
  @ApiOperation({ summary: 'Batalkan permintaan barang' })
  async cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('version') version: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.requestService.cancel(id, user.sub, version);
  }
}
