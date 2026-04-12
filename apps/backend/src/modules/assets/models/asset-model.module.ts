import { Module } from '@nestjs/common';
import { AssetModelController } from './asset-model.controller';
import { AssetModelService } from './asset-model.service';

@Module({
  controllers: [AssetModelController],
  providers: [AssetModelService],
  exports: [AssetModelService],
})
export class AssetModelModule {}
