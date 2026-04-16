import { IsInt, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateStockThresholdDto {
  @ApiProperty({
    description: 'Jumlah minimum stok yang memicu alert',
    minimum: 0,
  })
  @IsInt()
  @Min(0)
  minQuantity: number;

  @ApiPropertyOptional({
    description: 'Jumlah warning stok sebelum mencapai minimum',
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  warningQuantity?: number;
}
