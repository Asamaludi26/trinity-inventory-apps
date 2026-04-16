import { IsOptional, IsEnum } from 'class-validator';
import { FilterAssetDto } from './filter-asset.dto';

export enum AssetViewMode {
  GROUP = 'group',
  LIST = 'list',
}

export class QueryAssetDto extends FilterAssetDto {
  @IsOptional()
  @IsEnum(AssetViewMode)
  view?: AssetViewMode = AssetViewMode.LIST;
}
