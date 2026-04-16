import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsEnum,
  IsNumber,
  IsPositive,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  AssetStatus,
  AssetCondition,
  AssetClassification,
  TrackingMethod,
  RecordingSource,
} from '../../../generated/prisma/client';

export class CreateAssetDto {
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
  classification?: AssetClassification; // ASSET or MATERIAL

  @IsOptional()
  @IsEnum(TrackingMethod)
  trackingMethod?: TrackingMethod; // INDIVIDUAL, COUNT, or MEASUREMENT

  @IsOptional()
  @IsString()
  serialNumber?: string;

  @IsOptional()
  @Type(() => Number)
  @IsPositive()
  quantity?: number; // For COUNT materials

  @IsOptional()
  @Type(() => Number)
  @Min(0)
  currentBalance?: number; // For MEASUREMENT materials

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
  macAddress?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  locationDetail?: string;

  @IsOptional()
  @IsString()
  locationNote?: string;

  @IsOptional()
  @IsEnum(RecordingSource)
  recordingSource?: RecordingSource;

  @IsOptional()
  @IsString()
  note?: string;
}
