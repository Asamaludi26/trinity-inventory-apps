import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  MaxLength,
} from 'class-validator';
import { AssetCondition } from '../../../generated/prisma/client';

export class ReportDamageDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  issueDescription: string;

  @IsEnum(AssetCondition)
  condition: AssetCondition;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  note?: string;
}
