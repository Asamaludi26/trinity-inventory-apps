import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsInt,
  IsDateString,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class DismantleItemDto {
  @IsNotEmpty({ message: 'Asset ID wajib diisi' })
  @IsString()
  assetId: string;

  @IsOptional()
  @IsString()
  note?: string;
}

export class CreateDismantleDto {
  @Type(() => Number)
  @IsInt()
  @IsNotEmpty({ message: 'Customer wajib dipilih' })
  customerId: number;

  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DismantleItemDto)
  items?: DismantleItemDto[];
}
