import { IsNotEmpty, IsString, IsOptional, IsEnum } from 'class-validator';
import { AssetCondition } from '../../../../generated/prisma/client';

// TODO: Create Repair Prisma model in schema/transaction.prisma
export class CreateRepairDto {
  @IsNotEmpty({ message: 'Asset ID wajib diisi' })
  @IsString()
  assetId: string;

  @IsNotEmpty({ message: 'Deskripsi kerusakan wajib diisi' })
  @IsString()
  description: string;

  @IsNotEmpty({ message: 'Kondisi aset wajib diisi' })
  @IsEnum(AssetCondition)
  condition: AssetCondition;

  @IsOptional()
  @IsString()
  note?: string;
}
