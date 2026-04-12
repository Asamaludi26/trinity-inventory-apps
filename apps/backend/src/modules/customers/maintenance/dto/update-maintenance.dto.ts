import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateMaintenanceDto } from './create-maintenance.dto';

export class UpdateMaintenanceDto extends PartialType(
  OmitType(CreateMaintenanceDto, [
    'customerId',
    'materials',
    'replacements',
  ] as const),
) {}
