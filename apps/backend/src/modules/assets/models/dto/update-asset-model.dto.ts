import { PartialType } from '@nestjs/mapped-types';
import { CreateAssetModelDto } from './create-asset-model.dto';

export class UpdateAssetModelDto extends PartialType(CreateAssetModelDto) {}
