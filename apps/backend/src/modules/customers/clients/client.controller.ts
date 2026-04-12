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
import { ClientService } from './client.service';
import { CreateClientDto, UpdateClientDto, FilterClientDto } from './dto';
import { Roles } from '../../../common/decorators';
import { UserRole } from '../../../generated/prisma/client';

@ApiTags('Customers')
@ApiBearerAuth('access-token')
@Controller('customers')
export class ClientController {
  constructor(private readonly clientService: ClientService) {}

  @Get()
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN_LOGISTIK, UserRole.LEADER)
  @ApiOperation({ summary: 'List pelanggan' })
  @ApiResponse({
    status: 200,
    description: 'Berhasil mengambil data pelanggan',
  })
  async findAll(@Query() query: FilterClientDto) {
    return this.clientService.findAll(query);
  }

  @Get(':id')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN_LOGISTIK, UserRole.LEADER)
  @ApiOperation({ summary: 'Detail pelanggan' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.clientService.findOne(id);
  }

  @Post()
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN_LOGISTIK)
  @ApiOperation({ summary: 'Buat pelanggan' })
  @ApiResponse({ status: 201, description: 'Pelanggan berhasil dibuat' })
  async create(@Body() dto: CreateClientDto) {
    return this.clientService.create(dto);
  }

  @Patch(':id')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN_LOGISTIK)
  @ApiOperation({ summary: 'Update pelanggan' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateClientDto,
  ) {
    return this.clientService.update(id, dto);
  }
}
