import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsOptional,
  IsString,
  IsEnum,
  Min,
  ValidateNested,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import { RequestItemStatus } from '../../../../generated/prisma/client';

export class ApproveItemAdjustmentDto {
  @ApiProperty({ description: 'ID item yang di-adjust' })
  @IsInt()
  itemId: number;

  @ApiProperty({ description: 'Jumlah yang disetujui' })
  @IsInt()
  @Min(0)
  approvedQuantity: number;

  @ApiPropertyOptional({
    description:
      'Status per item: APPROVED, PARTIAL, STOCK_ALLOCATED, PROCUREMENT_NEEDED, REJECTED',
    enum: RequestItemStatus,
  })
  @IsOptional()
  @IsEnum(RequestItemStatus)
  itemStatus?: RequestItemStatus;

  @ApiPropertyOptional({
    description: 'Alasan (wajib untuk PARTIAL dan REJECTED)',
  })
  @IsOptional()
  @IsString()
  itemReason?: string;
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
