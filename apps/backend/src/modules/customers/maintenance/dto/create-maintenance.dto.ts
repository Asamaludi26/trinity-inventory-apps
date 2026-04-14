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
  IsIn,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AssetCondition } from '../../../../generated/prisma/client';

export class MaintenanceMaterialDto {
  @IsNotEmpty({ message: 'Deskripsi material wajib diisi' })
  @IsString()
  @MaxLength(255)
  description: string;

  @Type(() => Number)
  @IsInt()
  @Min(1, { message: 'Jumlah minimal 1' })
  quantity: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  modelId?: number;

  @IsOptional()
  @IsString()
  note?: string;
}

export class MaintenanceReplacementDto {
  @IsNotEmpty({ message: 'Deskripsi aset lama wajib diisi' })
  @IsString()
  @MaxLength(255)
  oldAssetDesc: string;

  @IsNotEmpty({ message: 'Deskripsi aset baru wajib diisi' })
  @IsString()
  @MaxLength(255)
  newAssetDesc: string;

  @IsOptional()
  @IsString()
  oldAssetId?: string;

  @IsOptional()
  @IsString()
  newAssetId?: string;

  @IsOptional()
  @IsEnum(AssetCondition, { message: 'Kondisi aset tidak valid' })
  conditionAfter?: AssetCondition;

  @IsOptional()
  @IsString()
  note?: string;
}

export class CreateMaintenanceDto {
  @Type(() => Number)
  @IsInt()
  @IsNotEmpty({ message: 'Customer wajib dipilih' })
  customerId: number;

  @IsOptional()
  @IsIn(['HIGH', 'MEDIUM', 'LOW'], {
    message: 'Prioritas harus HIGH, MEDIUM, atau LOW',
  })
  priority?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  workTypes?: string[];

  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @IsOptional()
  @IsString()
  issueReport?: string;

  @IsOptional()
  @IsString()
  resolution?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MaintenanceMaterialDto)
  materials?: MaintenanceMaterialDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MaintenanceReplacementDto)
  replacements?: MaintenanceReplacementDto[];
}
