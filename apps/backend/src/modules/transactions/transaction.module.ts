import { Module } from '@nestjs/common';
import { RequestModule } from './requests/request.module';
import { LoanModule } from './loans/loan.module';
import { ReturnModule } from './returns/return.module';
import { HandoverModule } from './handovers/handover.module';

@Module({
  imports: [RequestModule, LoanModule, ReturnModule, HandoverModule],
})
export class TransactionModule {}
