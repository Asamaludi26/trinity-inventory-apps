import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';

export class HandoverItemDto {
  @IsNotEmpty({ message: 'Asset ID wajib diisi' })
  @IsString()
  assetId: string;

  @IsOptional()
  @IsString()
  note?: string;
}

export class CreateHandoverDto {
  @Type(() => Number)
  @IsInt()
  @IsNotEmpty({ message: 'User tujuan wajib dipilih' })
  toUserId: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  witnessUserId?: number;

  @IsOptional()
  @IsString()
  note?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HandoverItemDto)
  items: HandoverItemDto[];
}
