import { Module } from '@nestjs/common';
import { AssetTypeController } from './asset-type.controller';
import { AssetTypeService } from './asset-type.service';

@Module({
  controllers: [AssetTypeController],
  providers: [AssetTypeService],
  exports: [AssetTypeService],
})
export class AssetTypeModule {}
