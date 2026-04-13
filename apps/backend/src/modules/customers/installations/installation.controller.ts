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
import { InstallationService } from './installation.service';
import {
  CreateInstallationDto,
  UpdateInstallationDto,
  FilterInstallationDto,
} from './dto';
import { AuthPermissions, CurrentUser } from '../../../common/decorators';
import { PERMISSIONS } from '../../../common/constants';
import { JwtPayload } from '../../../common/interfaces';

@ApiTags('Installations')
@ApiBearerAuth('access-token')
@Controller('installation')
export class InstallationController {
  constructor(private readonly installationService: InstallationService) {}

  @Get()
  @AuthPermissions(PERMISSIONS.INSTALLATIONS_VIEW)
  @ApiOperation({ summary: 'List instalasi' })
  @ApiResponse({
    status: 200,
    description: 'Berhasil mengambil data instalasi',
  })
  async findAll(@Query() query: FilterInstallationDto) {
    return this.installationService.findAll(query);
  }

  @Get(':id')
  @AuthPermissions(PERMISSIONS.INSTALLATIONS_VIEW)
  @ApiOperation({ summary: 'Detail instalasi' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.installationService.findOne(id);
  }

  @Post()
  @AuthPermissions(PERMISSIONS.ASSETS_INSTALL)
  @ApiOperation({ summary: 'Buat instalasi' })
  @ApiResponse({ status: 201, description: 'Instalasi berhasil dibuat' })
  async create(
    @Body() dto: CreateInstallationDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.installationService.create(dto, user.sub);
  }

  @Patch(':id')
  @AuthPermissions(PERMISSIONS.ASSETS_INSTALL)
  @ApiOperation({ summary: 'Update instalasi' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateInstallationDto,
  ) {
    return this.installationService.update(id, dto);
  }
}
