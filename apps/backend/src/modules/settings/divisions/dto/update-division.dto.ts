import { PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsBoolean } from 'class-validator';
import { CreateDivisionDto } from './create-division.dto';

export class UpdateDivisionDto extends PartialType(CreateDivisionDto) {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
