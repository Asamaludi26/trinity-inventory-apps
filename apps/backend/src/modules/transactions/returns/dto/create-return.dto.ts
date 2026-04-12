import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AssetCondition } from '../../../../generated/prisma/client';

export class ReturnItemDto {
  @IsNotEmpty({ message: 'Asset ID wajib diisi' })
  @IsString()
  assetId: string;

  @IsNotEmpty({ message: 'Kondisi sebelum wajib diisi' })
  @IsEnum(AssetCondition)
  conditionBefore: AssetCondition;

  @IsNotEmpty({ message: 'Kondisi setelah wajib diisi' })
  @IsEnum(AssetCondition)
  conditionAfter: AssetCondition;

  @IsOptional()
  @IsString()
  note?: string;
}

export class CreateReturnDto {
  @IsNotEmpty({ message: 'Loan Request ID wajib diisi' })
  @IsString()
  loanRequestId: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReturnItemDto)
  items: ReturnItemDto[];
}
