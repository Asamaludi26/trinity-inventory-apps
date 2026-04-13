import { Module } from '@nestjs/common';
import { HandoverController } from './handover.controller';
import { HandoverService } from './handover.service';
import { ApprovalModule } from '../approval/approval.module';
import { StockMovementModule } from '../stock-movements/stock-movement.module';

@Module({
  imports: [ApprovalModule, StockMovementModule],
  controllers: [HandoverController],
  providers: [HandoverService],
  exports: [HandoverService],
})
export class HandoverModule {}
