import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateInstallationDto } from './create-installation.dto';

export class UpdateInstallationDto extends PartialType(
  OmitType(CreateInstallationDto, ['customerId', 'materials'] as const),
) {}
