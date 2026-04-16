import { Module } from '@nestjs/common';
import { DismantleController } from './dismantle.controller';
import { DismantleService } from './dismantle.service';
import { StockMovementModule } from '../../transactions/stock-movements/stock-movement.module';
import { CustomerModule as ClientModule } from '../clients/client.module';
import { AssetModule } from '../../assets/asset.module';

@Module({
  imports: [StockMovementModule, ClientModule, AssetModule],
  controllers: [DismantleController],
  providers: [DismantleService],
  exports: [DismantleService],
})
export class DismantleModule {}
