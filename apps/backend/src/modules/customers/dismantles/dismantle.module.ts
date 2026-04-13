import { Module } from '@nestjs/common';
import { DismantleController } from './dismantle.controller';
import { DismantleService } from './dismantle.service';
import { StockMovementModule } from '../../transactions/stock-movements/stock-movement.module';

@Module({
  imports: [StockMovementModule],
  controllers: [DismantleController],
  providers: [DismantleService],
  exports: [DismantleService],
})
export class DismantleModule {}
