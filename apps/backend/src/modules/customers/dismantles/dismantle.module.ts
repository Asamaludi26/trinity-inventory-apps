import { Module } from '@nestjs/common';
import { DismantleController } from './dismantle.controller';
import { DismantleService } from './dismantle.service';

@Module({
  controllers: [DismantleController],
  providers: [DismantleService],
  exports: [DismantleService],
})
export class DismantleModule {}
