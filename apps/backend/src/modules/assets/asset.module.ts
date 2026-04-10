import { Module } from '@nestjs/common';
import { AssetController } from './asset.controller';
import { AssetService } from './asset.service';
import { CategoryModule } from './categories/category.module';
import { AssetTypeModule } from './types/asset-type.module';
import { AssetModelModule } from './models/asset-model.module';
import { PurchaseModule } from './purchases/purchase.module';
import { DepreciationModule } from './depreciation/depreciation.module';

@Module({
  imports: [
    CategoryModule,
    AssetTypeModule,
    AssetModelModule,
    PurchaseModule,
    DepreciationModule,
  ],
  controllers: [AssetController],
  providers: [AssetService],
  exports: [AssetService],
})
export class AssetModule {}
