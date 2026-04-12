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
import { ProjectService } from './project.service';
import { CreateProjectDto, UpdateProjectDto, FilterProjectDto } from './dto';
import { CurrentUser } from '../../../common/decorators';
import { JwtPayload } from '../../../common/interfaces';

@ApiTags('Projects')
@ApiBearerAuth('access-token')
@Controller('projects')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Get()
  @ApiOperation({ summary: 'List proyek infrastruktur' })
  @ApiResponse({ status: 200, description: 'Berhasil mengambil data proyek' })
  async findAll(
    @Query() query: FilterProjectDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.projectService.findAll(query, user.sub, user.role);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detail proyek' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.projectService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Buat proyek' })
  @ApiResponse({ status: 201, description: 'Proyek berhasil dibuat' })
  async create(@Body() dto: CreateProjectDto, @CurrentUser() user: JwtPayload) {
    return this.projectService.create(dto, user.sub);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update proyek' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.projectService.update(id, dto);
  }

  @Patch(':id/approve')
  @ApiOperation({ summary: 'Approve proyek' })
  async approve(@Param('id', ParseUUIDPipe) id: string) {
    return this.projectService.approve(id);
  }

  @Patch(':id/reject')
  @ApiOperation({ summary: 'Reject proyek' })
  async reject(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('reason') reason: string,
  ) {
    return this.projectService.reject(id, reason);
  }

  @Patch(':id/execute')
  @ApiOperation({ summary: 'Eksekusi proyek' })
  async execute(@Param('id', ParseUUIDPipe) id: string) {
    return this.projectService.execute(id);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Batalkan proyek' })
  async cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.projectService.cancel(id, user.sub);
  }
}
