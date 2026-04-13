import { Module } from '@nestjs/common';
import { InstallationController } from './installation.controller';
import { InstallationService } from './installation.service';
import { StockMovementModule } from '../../transactions/stock-movements/stock-movement.module';

@Module({
  imports: [StockMovementModule],
  controllers: [InstallationController],
  providers: [InstallationService],
  exports: [InstallationService],
})
export class InstallationModule {}
