import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  Min,
  IsOptional,
  ValidateNested,
} from 'class-validator';

export class ThresholdItemDto {
  @IsInt()
  @Min(1)
  modelId: number;

  @IsInt()
  @Min(0)
  minQuantity: number;

  @IsInt()
  @IsOptional()
  @Min(0)
  warningQuantity?: number;
}

export class ThresholdBulkDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ThresholdItemDto)
  items: ThresholdItemDto[];
}
