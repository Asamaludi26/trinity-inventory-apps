import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateHandoverDto } from './create-handover.dto';

export class UpdateHandoverDto extends PartialType(
  OmitType(CreateHandoverDto, ['items'] as const),
) {}
