import { IsOptional, IsEnum } from 'class-validator';
import { PaginationQueryDto } from '../../../../common/dto/pagination-query.dto';
import { DepreciationMethod } from '../../../../generated/prisma/client';

export class FilterDepreciationDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(DepreciationMethod)
  method?: DepreciationMethod;
}
