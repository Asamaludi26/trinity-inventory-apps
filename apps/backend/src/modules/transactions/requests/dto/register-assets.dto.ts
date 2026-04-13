import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AssetCondition } from '../../../../generated/prisma/client';

export class RegisterAssetItemDto {
  @ApiProperty({ description: 'ID request item yang didaftarkan' })
  @IsInt()
  requestItemId: number;

  @ApiPropertyOptional({
    description: 'Daftar serial number per unit aset (opsional)',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  serialNumbers?: string[];

  @ApiPropertyOptional({ description: 'Harga pembelian per unit' })
  @IsOptional()
  @IsNumber()
  purchasePrice?: number;

  @ApiPropertyOptional({
    description: 'Kondisi aset saat diterima',
    enum: AssetCondition,
    default: AssetCondition.NEW,
  })
  @IsOptional()
  @IsEnum(AssetCondition)
  condition?: AssetCondition;

  @ApiPropertyOptional({
    description: 'Nama aset (jika item tidak punya model)',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Brand aset (jika item tidak punya model)',
  })
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiPropertyOptional({
    description: 'Category ID aset (jika item tidak punya model)',
  })
  @IsOptional()
  @IsInt()
  categoryId?: number;

  @ApiPropertyOptional({ description: 'Catatan tambahan' })
  @IsOptional()
  @IsString()
  note?: string;
}

export class RegisterAssetsDto {
  @ApiProperty({ description: 'Version untuk optimistic locking' })
  @IsInt()
  version: number;

  @ApiProperty({
    description: 'Daftar item yang didaftarkan sebagai aset',
    type: [RegisterAssetItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RegisterAssetItemDto)
  items: RegisterAssetItemDto[];
}
