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
import { AuthPermissions, CurrentUser } from '../../../common/decorators';
import { PERMISSIONS } from '../../../common/constants';
import { JwtPayload } from '../../../common/interfaces';

@ApiTags('Dismantles')
@ApiBearerAuth('access-token')
@Controller('dismantle')
export class DismantleController {
  constructor(private readonly dismantleService: DismantleService) {}

  @Get()
  @AuthPermissions(PERMISSIONS.DISMANTLES_VIEW)
  @ApiOperation({ summary: 'List dismantle' })
  @ApiResponse({
    status: 200,
    description: 'Berhasil mengambil data dismantle',
  })
  async findAll(@Query() query: FilterDismantleDto) {
    return this.dismantleService.findAll(query);
  }

  @Get(':id')
  @AuthPermissions(PERMISSIONS.DISMANTLES_VIEW)
  @ApiOperation({ summary: 'Detail dismantle' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.dismantleService.findOne(id);
  }

  @Post()
  @AuthPermissions(PERMISSIONS.ASSETS_DISMANTLE)
  @ApiOperation({ summary: 'Buat dismantle' })
  @ApiResponse({ status: 201, description: 'Dismantle berhasil dibuat' })
  async create(
    @Body() dto: CreateDismantleDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.dismantleService.create(dto, user.sub);
  }

  @Patch(':id')
  @AuthPermissions(PERMISSIONS.ASSETS_DISMANTLE)
  @ApiOperation({ summary: 'Update dismantle' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDismantleDto,
  ) {
    return this.dismantleService.update(id, dto);
  }

  @Patch(':id/complete')
  @AuthPermissions(PERMISSIONS.ASSETS_DISMANTLE)
  @ApiOperation({ summary: 'Selesaikan dismantle — kembalikan aset ke gudang' })
  @ApiResponse({ status: 200, description: 'Dismantle berhasil diselesaikan' })
  async complete(
    @Param('id', ParseIntPipe) id: number,
    @Body('itemConditions')
    itemConditions: Array<{ assetId: string; conditionAfter: string }>,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.dismantleService.complete(
      id,
      user.sub,
      itemConditions as never,
    );
  }
}
