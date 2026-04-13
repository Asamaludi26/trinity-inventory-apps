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
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { PurchaseService } from './purchase.service';
import { CreatePurchaseDto, UpdatePurchaseDto, FilterPurchaseDto } from './dto';
import { AuthPermissions, CurrentUser } from '../../../common/decorators';
import { PERMISSIONS } from '../../../common/constants';
import { JwtPayload } from '../../../common/interfaces';

@ApiTags('Purchases')
@ApiBearerAuth('access-token')
@Controller('assets/purchases')
export class PurchaseController {
  constructor(private readonly purchaseService: PurchaseService) {}

  @Get()
  @AuthPermissions(PERMISSIONS.PURCHASES_VIEW)
  @ApiOperation({ summary: 'List data pembelian' })
  @ApiResponse({
    status: 200,
    description: 'Berhasil mengambil data pembelian',
  })
  async findAll(@Query() query: FilterPurchaseDto) {
    return this.purchaseService.findAll(query);
  }

  @Get(':id')
  @AuthPermissions(PERMISSIONS.PURCHASES_VIEW)
  @ApiOperation({ summary: 'Detail data pembelian' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.purchaseService.findOne(id);
  }

  @Post()
  @AuthPermissions(PERMISSIONS.PURCHASES_CREATE)
  @ApiOperation({ summary: 'Buat data pembelian' })
  @ApiResponse({ status: 201, description: 'Data pembelian berhasil dibuat' })
  async create(
    @Body() dto: CreatePurchaseDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.purchaseService.create(dto, user.sub);
  }

  @Patch(':id')
  @AuthPermissions(PERMISSIONS.PURCHASES_EDIT)
  @ApiOperation({ summary: 'Update data pembelian' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePurchaseDto,
  ) {
    return this.purchaseService.update(id, dto);
  }

  @Delete(':id')
  @AuthPermissions(PERMISSIONS.PURCHASES_DELETE)
  @ApiOperation({ summary: 'Hapus data pembelian (soft delete)' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.purchaseService.remove(id);
  }
}
