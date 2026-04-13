import { IsOptional, IsString, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { AssetStatus, AssetCondition } from '../../../generated/prisma/client';

export enum ExportFormat {
  XLSX = 'xlsx',
  CSV = 'csv',
  PDF = 'pdf',
}

export class ExportAssetQueryDto {
  @IsEnum(ExportFormat)
  @ApiPropertyOptional({ enum: ExportFormat, default: ExportFormat.XLSX })
  format: ExportFormat = ExportFormat.XLSX;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  search?: string;

  @IsOptional()
  @IsEnum(AssetStatus)
  @ApiPropertyOptional({ enum: AssetStatus })
  status?: AssetStatus;

  @IsOptional()
  @IsEnum(AssetCondition)
  @ApiPropertyOptional({ enum: AssetCondition })
  condition?: AssetCondition;

  @IsOptional()
  @Type(() => Number)
  @ApiPropertyOptional()
  categoryId?: number;

  @IsOptional()
  @Type(() => Number)
  @ApiPropertyOptional()
  typeId?: number;

  @IsOptional()
  @Type(() => Number)
  @ApiPropertyOptional()
  modelId?: number;
}

export class ExportTransactionQueryDto {
  @IsEnum(ExportFormat)
  @ApiPropertyOptional({ enum: ExportFormat, default: ExportFormat.XLSX })
  format: ExportFormat = ExportFormat.XLSX;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  search?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  status?: string;
}

export class ExportCustomerQueryDto {
  @IsEnum(ExportFormat)
  @ApiPropertyOptional({ enum: ExportFormat, default: ExportFormat.XLSX })
  format: ExportFormat = ExportFormat.XLSX;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  search?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  isActive?: string;
}

export class ExportStockQueryDto {
  @IsEnum(ExportFormat)
  @ApiPropertyOptional({ enum: ExportFormat, default: ExportFormat.XLSX })
  format: ExportFormat = ExportFormat.XLSX;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  search?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description: 'Filter by MovementType (IN/OUT/ADJUSTMENT)',
  })
  movementType?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Filter from date (ISO 8601)' })
  startDate?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Filter to date (ISO 8601)' })
  endDate?: string;
}
