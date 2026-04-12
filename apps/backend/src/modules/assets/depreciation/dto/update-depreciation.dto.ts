import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateDepreciationDto } from './create-depreciation.dto';

export class UpdateDepreciationDto extends PartialType(
  OmitType(CreateDepreciationDto, ['purchaseId'] as const),
) {}
