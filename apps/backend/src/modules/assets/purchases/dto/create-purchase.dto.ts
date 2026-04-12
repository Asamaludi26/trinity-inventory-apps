import {
  IsNotEmpty,
  IsString,
  IsInt,
  IsNumber,
  IsOptional,
  IsDateString,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePurchaseDto {
  @Type(() => Number)
  @IsInt()
  @IsNotEmpty({ message: 'Model aset wajib dipilih' })
  modelId: number;

  @IsNotEmpty({ message: 'Supplier wajib diisi' })
  @IsString()
  @MaxLength(255)
  supplier: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0, { message: 'Harga satuan tidak boleh negatif' })
  unitPrice: number;

  @Type(() => Number)
  @IsInt()
  @Min(1, { message: 'Jumlah minimal 1' })
  quantity: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0, { message: 'Total harga tidak boleh negatif' })
  totalPrice: number;

  @IsNotEmpty({ message: 'Tanggal pembelian wajib diisi' })
  @IsDateString()
  purchaseDate: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  warrantyMonths?: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  invoiceNumber?: string;

  @IsOptional()
  @IsString()
  note?: string;
}
