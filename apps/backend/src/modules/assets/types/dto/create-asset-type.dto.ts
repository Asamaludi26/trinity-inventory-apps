import {
  IsNotEmpty,
  IsString,
  MaxLength,
  IsInt,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  AssetClassification,
  TrackingMethod,
} from '../../../../generated/prisma/client';

export class CreateAssetTypeDto {
  @Type(() => Number)
  @IsInt()
  @IsNotEmpty({ message: 'Kategori wajib dipilih' })
  categoryId: number;

  @IsNotEmpty({ message: 'Nama tipe wajib diisi' })
  @IsString()
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsEnum(AssetClassification, {
    message: 'Klasifikasi harus ASSET atau MATERIAL',
  })
  classification?: AssetClassification;

  @IsOptional()
  @IsEnum(TrackingMethod, {
    message: 'Metode tracking harus INDIVIDUAL, COUNT, atau MEASUREMENT',
  })
  trackingMethod?: TrackingMethod;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  unitOfMeasure?: string;
}
