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
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { ProjectService } from './project.service';
import {
  CreateProjectDto,
  UpdateProjectDto,
  FilterProjectDto,
  ProjectTaskDto,
  UpdateTaskDto,
  ProjectMaterialDto,
  ProjectTeamMemberDto,
} from './dto';
import { AuthPermissions, CurrentUser } from '../../../common/decorators';
import { PERMISSIONS } from '../../../common/constants';
import { JwtPayload } from '../../../common/interfaces';

@ApiTags('Projects')
@ApiBearerAuth('access-token')
@Controller('projects')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Get()
  @AuthPermissions(PERMISSIONS.PROJECTS_VIEW)
  @ApiOperation({ summary: 'List proyek infrastruktur' })
  @ApiResponse({ status: 200, description: 'Berhasil mengambil data proyek' })
  async findAll(
    @Query() query: FilterProjectDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.projectService.findAll(query, user.sub, user.role);
  }

  @Get(':id')
  @AuthPermissions(PERMISSIONS.PROJECTS_VIEW)
  @ApiOperation({ summary: 'Detail proyek' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.projectService.findOne(id);
  }

  @Post()
  @AuthPermissions(PERMISSIONS.PROJECTS_CREATE)
  @ApiOperation({ summary: 'Buat proyek' })
  @ApiResponse({ status: 201, description: 'Proyek berhasil dibuat' })
  async create(@Body() dto: CreateProjectDto, @CurrentUser() user: JwtPayload) {
    return this.projectService.create(dto, user.sub);
  }

  @Patch(':id')
  @AuthPermissions(PERMISSIONS.PROJECTS_EDIT)
  @ApiOperation({ summary: 'Update proyek' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProjectDto,
    @Body('version') version: number,
  ) {
    return this.projectService.update(id, dto, version);
  }

  @Patch(':id/approve')
  @AuthPermissions(PERMISSIONS.PROJECTS_APPROVE)
  @ApiOperation({ summary: 'Approve proyek' })
  async approve(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('version') version: number,
  ) {
    return this.projectService.approve(id, version);
  }

  @Patch(':id/reject')
  @AuthPermissions(PERMISSIONS.PROJECTS_APPROVE)
  @ApiOperation({ summary: 'Reject proyek' })
  async reject(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('reason') reason: string,
    @Body('version') version: number,
  ) {
    return this.projectService.reject(id, reason, version);
  }

  @Patch(':id/execute')
  @AuthPermissions(PERMISSIONS.PROJECTS_APPROVE)
  @ApiOperation({ summary: 'Eksekusi proyek' })
  async execute(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('version') version: number,
  ) {
    return this.projectService.execute(id, version);
  }

  @Patch(':id/cancel')
  @AuthPermissions(PERMISSIONS.PROJECTS_CREATE)
  @ApiOperation({ summary: 'Batalkan proyek' })
  async cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('version') version: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.projectService.cancel(id, user.sub, version);
  }

  @Patch(':id/complete')
  @AuthPermissions(PERMISSIONS.PROJECTS_APPROVE)
  @ApiOperation({ summary: 'Selesaikan proyek' })
  async complete(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('version') version: number,
  ) {
    return this.projectService.complete(id, version);
  }

  @Patch(':id/hold')
  @AuthPermissions(PERMISSIONS.PROJECTS_APPROVE)
  @ApiOperation({ summary: 'Hold proyek' })
  async hold(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('version') version: number,
  ) {
    return this.projectService.hold(id, version);
  }

  @Patch(':id/resume')
  @AuthPermissions(PERMISSIONS.PROJECTS_APPROVE)
  @ApiOperation({ summary: 'Resume proyek dari hold' })
  async resume(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('version') version: number,
  ) {
    return this.projectService.resume(id, version);
  }

  // ──────────────── Task CRUD ────────────────

  @Post(':id/tasks')
  @AuthPermissions(PERMISSIONS.PROJECTS_MANAGE_TASKS)
  @ApiOperation({ summary: 'Tambah task ke proyek' })
  async addTask(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ProjectTaskDto,
  ) {
    return this.projectService.addTask(id, dto);
  }

  @Patch(':id/tasks/:taskId')
  @AuthPermissions(PERMISSIONS.PROJECTS_MANAGE_TASKS)
  @ApiOperation({ summary: 'Update task proyek' })
  async updateTask(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('taskId', ParseIntPipe) taskId: number,
    @Body() data: UpdateTaskDto,
  ) {
    return this.projectService.updateTask(id, taskId, data);
  }

  @Delete(':id/tasks/:taskId')
  @AuthPermissions(PERMISSIONS.PROJECTS_MANAGE_TASKS)
  @ApiOperation({ summary: 'Hapus task proyek' })
  async removeTask(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('taskId', ParseIntPipe) taskId: number,
  ) {
    return this.projectService.removeTask(id, taskId);
  }

  // ──────────────── Material CRUD ────────────────

  @Post(':id/materials')
  @AuthPermissions(PERMISSIONS.PROJECTS_EDIT)
  @ApiOperation({ summary: 'Tambah material ke proyek' })
  async addMaterial(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ProjectMaterialDto,
  ) {
    return this.projectService.addMaterial(id, dto);
  }

  @Delete(':id/materials/:materialId')
  @AuthPermissions(PERMISSIONS.PROJECTS_EDIT)
  @ApiOperation({ summary: 'Hapus material dari proyek' })
  async removeMaterial(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('materialId', ParseIntPipe) materialId: number,
  ) {
    return this.projectService.removeMaterial(id, materialId);
  }

  // ──────────────── Team CRUD ────────────────

  @Post(':id/team')
  @AuthPermissions(PERMISSIONS.PROJECTS_MANAGE_TEAM)
  @ApiOperation({ summary: 'Tambah anggota tim' })
  async addTeamMember(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ProjectTeamMemberDto,
  ) {
    return this.projectService.addTeamMember(id, dto);
  }

  @Delete(':id/team/:memberId')
  @AuthPermissions(PERMISSIONS.PROJECTS_MANAGE_TEAM)
  @ApiOperation({ summary: 'Hapus anggota tim' })
  async removeTeamMember(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('memberId', ParseIntPipe) memberId: number,
  ) {
    return this.projectService.removeTeamMember(id, memberId);
  }
}
