import { Module } from '@nestjs/common';
import { AssetModelService } from './asset-model.service';

@Module({
  providers: [AssetModelService],
  exports: [AssetModelService],
})
export class AssetModelModule {}
