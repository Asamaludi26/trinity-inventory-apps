import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { ClientService } from './client.service';
import { CreateClientDto, UpdateClientDto, FilterClientDto } from './dto';
import { AuthPermissions } from '../../../common/decorators';
import { PERMISSIONS } from '../../../common/constants';

@ApiTags('Customers')
@ApiBearerAuth('access-token')
@Controller('customers')
export class ClientController {
  constructor(private readonly clientService: ClientService) {}

  @Get()
  @AuthPermissions(PERMISSIONS.CUSTOMERS_VIEW)
  @ApiOperation({ summary: 'List pelanggan' })
  @ApiResponse({
    status: 200,
    description: 'Berhasil mengambil data pelanggan',
  })
  async findAll(@Query() query: FilterClientDto) {
    return this.clientService.findAll(query);
  }

  @Get(':id')
  @AuthPermissions(PERMISSIONS.CUSTOMERS_VIEW)
  @ApiOperation({ summary: 'Detail pelanggan' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.clientService.findOne(id);
  }

  @Post()
  @AuthPermissions(PERMISSIONS.CUSTOMERS_CREATE)
  @ApiOperation({ summary: 'Buat pelanggan' })
  @ApiResponse({ status: 201, description: 'Pelanggan berhasil dibuat' })
  async create(@Body() dto: CreateClientDto) {
    return this.clientService.create(dto);
  }

  @Patch(':id')
  @AuthPermissions(PERMISSIONS.CUSTOMERS_EDIT)
  @ApiOperation({ summary: 'Update pelanggan' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateClientDto,
  ) {
    return this.clientService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @AuthPermissions(PERMISSIONS.CUSTOMERS_DELETE)
  @ApiOperation({ summary: 'Hapus pelanggan (soft delete)' })
  @ApiResponse({ status: 204, description: 'Pelanggan berhasil dihapus' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.clientService.remove(id);
  }
}
