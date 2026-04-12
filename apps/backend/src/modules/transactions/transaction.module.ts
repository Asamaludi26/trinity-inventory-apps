import { Module } from '@nestjs/common';
import { RequestModule } from './requests/request.module';
import { LoanModule } from './loans/loan.module';
import { ReturnModule } from './returns/return.module';
import { HandoverModule } from './handovers/handover.module';
import { RepairModule } from './repairs/repair.module';
import { ProjectModule } from './projects/project.module';

@Module({
  imports: [
    RequestModule,
    LoanModule,
    ReturnModule,
    HandoverModule,
    RepairModule,
    ProjectModule,
  ],
})
export class TransactionModule {}
