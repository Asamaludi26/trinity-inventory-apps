import {
  IsArray,
  ValidateNested,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsInt,
  IsNumber,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  AssetStatus,
  AssetCondition,
  AssetClassification,
  TrackingMethod,
} from '../../../generated/prisma/client';

export class BatchAssetItemDto {
  @IsOptional()
  @IsString()
  code?: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @Type(() => Number)
  @IsInt()
  categoryId: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  typeId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  modelId?: number;

  @IsString()
  @IsNotEmpty()
  brand: string;

  @IsOptional()
  @IsEnum(AssetClassification)
  classification?: AssetClassification;

  @IsOptional()
  @IsEnum(TrackingMethod)
  trackingMethod?: TrackingMethod;

  @IsOptional()
  @IsString()
  serialNumber?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  quantity?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  currentBalance?: number;

  @IsOptional()
  @IsNumber()
  purchasePrice?: number;

  @IsOptional()
  @IsEnum(AssetStatus)
  status?: AssetStatus;

  @IsOptional()
  @IsEnum(AssetCondition)
  condition?: AssetCondition;

  @IsOptional()
  @IsString()
  note?: string;
}

export class CreateBatchAssetDto {
  @IsString()
  @IsNotEmpty()
  docNumber: string; // REG-YYYY-MM-XXXX (auto-generated or provided)

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BatchAssetItemDto)
  items: BatchAssetItemDto[];

  @IsOptional()
  @IsString()
  note?: string;
}
