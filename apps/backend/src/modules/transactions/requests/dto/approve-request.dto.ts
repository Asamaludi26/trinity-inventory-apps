import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ApproveItemAdjustmentDto {
  @ApiProperty({ description: 'ID item yang di-adjust' })
  @IsInt()
  itemId: number;

  @ApiProperty({ description: 'Jumlah yang disetujui' })
  @IsInt()
  @Min(0)
  approvedQuantity: number;
}

export class ApproveRequestDto {
  @ApiProperty({ description: 'Version untuk optimistic locking' })
  @IsInt()
  version: number;

  @ApiPropertyOptional({ description: 'Catatan approval' })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({
    description: 'Penyesuaian qty per item (partial approval)',
    type: [ApproveItemAdjustmentDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ApproveItemAdjustmentDto)
  itemAdjustments?: ApproveItemAdjustmentDto[];
}
