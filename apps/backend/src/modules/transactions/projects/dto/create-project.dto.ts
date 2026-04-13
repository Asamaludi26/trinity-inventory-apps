import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  IsInt,
  IsDateString,
  MaxLength,
  Min,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  BLOCKED = 'BLOCKED',
  COMPLETED = 'COMPLETED',
}

export class ProjectTaskDto {
  @IsNotEmpty({ message: 'Judul task wajib diisi' })
  @IsString()
  @MaxLength(255)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  assigneeId?: number;

  @IsOptional()
  @IsDateString()
  dueDate?: string;
}

export class UpdateTaskDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(TaskStatus, {
    message: 'Status tidak valid. Pilih: TODO, IN_PROGRESS, BLOCKED, COMPLETED',
  })
  status?: TaskStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  assigneeId?: number;

  @IsOptional()
  @IsDateString()
  dueDate?: string;
}

export class ProjectMaterialDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  modelId?: number;

  @IsNotEmpty({ message: 'Deskripsi material wajib diisi' })
  @IsString()
  @MaxLength(255)
  description: string;

  @Type(() => Number)
  @IsInt()
  @Min(1, { message: 'Jumlah minimal 1' })
  quantity: number;

  @IsOptional()
  @IsString()
  note?: string;
}

export class ProjectTeamMemberDto {
  @Type(() => Number)
  @IsInt()
  @IsNotEmpty({ message: 'User ID wajib diisi' })
  userId: number;

  @IsNotEmpty({ message: 'Role wajib diisi' })
  @IsString()
  @MaxLength(50)
  role: string;
}

export class CreateProjectDto {
  @IsNotEmpty({ message: 'Nama proyek wajib diisi' })
  @IsString()
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  location?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  customerId?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProjectTaskDto)
  tasks?: ProjectTaskDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProjectMaterialDto)
  materials?: ProjectMaterialDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProjectTeamMemberDto)
  team?: ProjectTeamMemberDto[];
}
