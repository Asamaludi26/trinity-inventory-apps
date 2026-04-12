import { IsOptional, IsEnum, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { AssetStatus, AssetCondition } from '../../../generated/prisma/client';

export class FilterAssetDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(AssetStatus, { message: 'Status aset tidak valid' })
  status?: AssetStatus;

  @IsOptional()
  @IsEnum(AssetCondition, { message: 'Kondisi aset tidak valid' })
  condition?: AssetCondition;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  categoryId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  typeId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  modelId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  divisionId?: number;
}
