import { Module } from '@nestjs/common';
import { LoanController } from './loan.controller';
import { LoanService } from './loan.service';
import { ApprovalModule } from '../approval/approval.module';
import { StockMovementModule } from '../stock-movements/stock-movement.module';

@Module({
  imports: [ApprovalModule, StockMovementModule],
  controllers: [LoanController],
  providers: [LoanService],
  exports: [LoanService],
})
export class LoanModule {}
