import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateRepairDto } from './create-repair.dto';

export class UpdateRepairDto extends PartialType(
  OmitType(CreateRepairDto, ['assetId'] as const),
) {}
