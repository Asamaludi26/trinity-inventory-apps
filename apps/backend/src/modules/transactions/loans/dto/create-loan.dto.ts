import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  IsInt,
  IsDateString,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class LoanItemDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  modelId?: number;

  @IsNotEmpty({ message: 'Deskripsi item wajib diisi' })
  @IsString()
  @MaxLength(255)
  description: string;

  @Type(() => Number)
  @IsInt()
  @Min(1, { message: 'Jumlah minimal 1' })
  quantity: number;
}

export class CreateLoanDto {
  @IsNotEmpty({ message: 'Tujuan peminjaman wajib diisi' })
  @IsString()
  purpose: string;

  @IsOptional()
  @IsDateString()
  expectedReturn?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LoanItemDto)
  items: LoanItemDto[];
}
