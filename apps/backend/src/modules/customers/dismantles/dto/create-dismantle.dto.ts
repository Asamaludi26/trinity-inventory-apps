import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsInt,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';

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
}
