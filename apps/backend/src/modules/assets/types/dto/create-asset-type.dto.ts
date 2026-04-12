import { IsNotEmpty, IsString, MaxLength, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAssetTypeDto {
  @Type(() => Number)
  @IsInt()
  @IsNotEmpty({ message: 'Kategori wajib dipilih' })
  categoryId: number;

  @IsNotEmpty({ message: 'Nama tipe wajib diisi' })
  @IsString()
  @MaxLength(255)
  name: string;
}
