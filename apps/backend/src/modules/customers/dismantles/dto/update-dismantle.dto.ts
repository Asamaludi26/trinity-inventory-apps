import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateDismantleDto } from './create-dismantle.dto';

export class UpdateDismantleDto extends PartialType(
  OmitType(CreateDismantleDto, ['customerId'] as const),
) {}
