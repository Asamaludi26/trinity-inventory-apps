import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsEnum,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AssetStatus, AssetCondition } from '../../../generated/prisma/client';

export class CreateAssetDto {
  @IsString()
  @IsNotEmpty()
  code: string;

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
  @IsString()
  serialNumber?: string;

  @IsOptional()
  @IsNumber()
  purchasePrice?: number;

  @IsOptional()
  @IsEnum(AssetStatus)
  status?: AssetStatus;

  @IsOptional()
  @IsEnum(AssetCondition)
  condition?: AssetCondition;
}
