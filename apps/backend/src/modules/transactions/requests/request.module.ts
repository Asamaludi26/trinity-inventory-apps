import { Module } from '@nestjs/common';
import { RequestController } from './request.controller';
import { RequestService } from './request.service';
import { ApprovalModule } from '../approval/approval.module';
import { StockMovementModule } from '../stock-movements/stock-movement.module';

@Module({
  imports: [ApprovalModule, StockMovementModule],
  controllers: [RequestController],
  providers: [RequestService],
  exports: [RequestService],
})
export class RequestModule {}
