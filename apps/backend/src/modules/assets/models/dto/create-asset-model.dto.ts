import {
  IsNotEmpty,
  IsString,
  MaxLength,
  IsInt,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
import { BulkTrackingType } from '../../../../generated/prisma/client';

export class CreateAssetModelDto {
  @Type(() => Number)
  @IsInt()
  @IsNotEmpty({ message: 'Tipe aset wajib dipilih' })
  typeId: number;

  @IsNotEmpty({ message: 'Nama model wajib diisi' })
  @IsString()
  @MaxLength(255)
  name: string;

  @IsNotEmpty({ message: 'Brand wajib diisi' })
  @IsString()
  @MaxLength(255)
  brand: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  unit?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  containerUnit?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Container size harus berupa angka' })
  containerSize?: number;

  @IsOptional()
  @IsEnum(BulkTrackingType, {
    message: 'Bulk type harus COUNT atau MEASUREMENT',
  })
  bulkType?: BulkTrackingType;

  @IsOptional()
  @IsBoolean()
  isInstallationTemplate?: boolean;
}
