import { IsOptional, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationQueryDto } from '../../../../common/dto/pagination-query.dto';

export class FilterAssetModelDto extends PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  typeId?: number;
}
