import { Module } from '@nestjs/common';
import { DepreciationService } from './depreciation.service';

@Module({
  providers: [DepreciationService],
  exports: [DepreciationService],
})
export class DepreciationModule {}
