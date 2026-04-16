import {
  IsNotEmpty,
  IsString,
  MaxLength,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsArray,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AssetClassification } from '../../../../generated/prisma/client';

export class CreateCategoryDto {
  @IsNotEmpty({ message: 'Nama kategori wajib diisi' })
  @IsString()
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsEnum(AssetClassification, {
    message: 'Klasifikasi harus ASSET atau MATERIAL',
  })
  defaultClassification?: AssetClassification;

  @IsOptional()
  @IsBoolean()
  isCustomerInstallable?: boolean;

  @IsOptional()
  @IsBoolean()
  isProjectAsset?: boolean;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Type(() => Number)
  divisionIds?: number[];
}
