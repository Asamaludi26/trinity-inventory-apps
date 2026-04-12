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

export class InstallationMaterialDto {
  @IsNotEmpty({ message: 'Deskripsi material wajib diisi' })
  @IsString()
  @MaxLength(255)
  description: string;

  @Type(() => Number)
  @IsInt()
  @Min(1, { message: 'Jumlah minimal 1' })
  quantity: number;

  @IsOptional()
  @IsString()
  note?: string;
}

export class CreateInstallationDto {
  @Type(() => Number)
  @IsInt()
  @IsNotEmpty({ message: 'Customer wajib dipilih' })
  customerId: number;

  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InstallationMaterialDto)
  materials?: InstallationMaterialDto[];
}
