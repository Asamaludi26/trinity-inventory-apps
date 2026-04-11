import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsBoolean,
  MaxLength,
} from 'class-validator';

export class CreateDivisionDto {
  @IsNotEmpty({ message: 'Nama divisi wajib diisi' })
  @IsString()
  @MaxLength(255)
  name: string;

  @IsNotEmpty({ message: 'Kode divisi wajib diisi' })
  @IsString()
  @MaxLength(10)
  code: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  canDoFieldwork?: boolean;
}
