import { Module } from '@nestjs/common';
import { InstallationController } from './installation.controller';
import { InstallationService } from './installation.service';
import { StockMovementModule } from '../../transactions/stock-movements/stock-movement.module';
import { AssetModule } from '../../assets/asset.module';
import { CustomerModule as ClientModule } from '../clients/client.module';

@Module({
  imports: [StockMovementModule, AssetModule, ClientModule],
  controllers: [InstallationController],
  providers: [InstallationService],
  exports: [InstallationService],
})
export class InstallationModule {}
