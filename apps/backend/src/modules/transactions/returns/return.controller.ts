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
import { CurrentUser } from '../../../common/decorators';
import { JwtPayload } from '../../../common/interfaces';

@ApiTags('Returns')
@ApiBearerAuth('access-token')
@Controller('returns')
export class ReturnController {
  constructor(private readonly returnService: ReturnService) {}

  @Get()
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
  @ApiOperation({ summary: 'Detail pengembalian' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.returnService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Buat pengembalian' })
  @ApiResponse({ status: 201, description: 'Pengembalian berhasil dibuat' })
  async create(@Body() dto: CreateReturnDto, @CurrentUser() user: JwtPayload) {
    return this.returnService.create(dto, user.sub);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update pengembalian' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateReturnDto,
  ) {
    return this.returnService.update(id, dto);
  }

  @Patch(':id/approve')
  @ApiOperation({ summary: 'Approve pengembalian' })
  async approve(@Param('id', ParseUUIDPipe) id: string) {
    return this.returnService.approve(id);
  }

  @Patch(':id/reject')
  @ApiOperation({ summary: 'Reject pengembalian' })
  async reject(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('reason') reason: string,
  ) {
    return this.returnService.reject(id, reason);
  }

  @Patch(':id/execute')
  @ApiOperation({ summary: 'Eksekusi pengembalian' })
  async execute(@Param('id', ParseUUIDPipe) id: string) {
    return this.returnService.execute(id);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Batalkan pengembalian' })
  async cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.returnService.cancel(id, user.sub);
  }
}
