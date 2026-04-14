import { Module } from '@nestjs/common';
import { MaintenanceController } from './maintenance.controller';
import { MaintenanceService } from './maintenance.service';
import { StockMovementModule } from '../../transactions/stock-movements/stock-movement.module';
import { AssetModule } from '../../assets/asset.module';

@Module({
  imports: [StockMovementModule, AssetModule],
  controllers: [MaintenanceController],
  providers: [MaintenanceService],
  exports: [MaintenanceService],
})
export class MaintenanceModule {}
