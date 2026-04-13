import { IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateStockThresholdDto {
  @ApiProperty({
    description: 'Jumlah minimum stok yang memicu alert',
    minimum: 0,
  })
  @IsInt()
  @Min(0)
  minQuantity: number;
}
