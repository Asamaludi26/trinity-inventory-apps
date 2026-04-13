import { Module } from '@nestjs/common';
import { RepairController } from './repair.controller';
import { RepairService } from './repair.service';
import { ApprovalModule } from '../approval/approval.module';
import { StockMovementModule } from '../stock-movements/stock-movement.module';

@Module({
  imports: [ApprovalModule, StockMovementModule],
  controllers: [RepairController],
  providers: [RepairService],
  exports: [RepairService],
})
export class RepairModule {}
