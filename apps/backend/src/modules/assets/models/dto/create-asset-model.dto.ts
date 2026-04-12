import { IsNotEmpty, IsString, MaxLength, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

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
}
