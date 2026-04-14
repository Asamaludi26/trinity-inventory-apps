import { Module } from '@nestjs/common';
import { AssetController } from './asset.controller';
import { AssetService } from './asset.service';
import { FifoConsumptionService } from './fifo-consumption.service';
import { CategoryModule } from './categories/category.module';
import { CategoryController } from './categories/category.controller';
import { AssetTypeModule } from './types/asset-type.module';
import { AssetTypeController } from './types/asset-type.controller';
import { AssetModelModule } from './models/asset-model.module';
import { AssetModelController } from './models/asset-model.controller';
import { PurchaseModule } from './purchases/purchase.module';
import { PurchaseController } from './purchases/purchase.controller';
import { DepreciationModule } from './depreciation/depreciation.module';
import { DepreciationController } from './depreciation/depreciation.controller';

@Module({
  imports: [
    CategoryModule,
    AssetTypeModule,
    AssetModelModule,
    PurchaseModule,
    DepreciationModule,
  ],
  controllers: [
    // Static routes MUST be registered before parameterized routes
    // to prevent AssetController's :id from catching sub-paths
    CategoryController,
    AssetTypeController,
    AssetModelController,
    PurchaseController,
    DepreciationController,
    AssetController, // Has @Get(':id') — MUST be last
  ],
  providers: [AssetService, FifoConsumptionService],
  exports: [AssetService, FifoConsumptionService],
})
export class AssetModule {}
