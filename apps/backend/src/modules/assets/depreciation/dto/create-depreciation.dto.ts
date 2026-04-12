import {
  IsNotEmpty,
  IsString,
  IsInt,
  IsNumber,
  IsEnum,
  IsDateString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DepreciationMethod } from '../../../../generated/prisma/client';

export class CreateDepreciationDto {
  @IsNotEmpty({ message: 'Data pembelian wajib dipilih' })
  @IsString()
  purchaseId: string;

  @IsNotEmpty({ message: 'Metode depresiasi wajib dipilih' })
  @IsEnum(DepreciationMethod, { message: 'Metode depresiasi tidak valid' })
  method: DepreciationMethod;

  @Type(() => Number)
  @IsInt()
  @Min(1, { message: 'Masa manfaat minimal 1 tahun' })
  usefulLifeYears: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0, { message: 'Nilai sisa tidak boleh negatif' })
  salvageValue: number;

  @IsNotEmpty({ message: 'Tanggal mulai wajib diisi' })
  @IsDateString()
  startDate: string;
}
