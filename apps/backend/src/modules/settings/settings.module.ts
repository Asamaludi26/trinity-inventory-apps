import { Module } from '@nestjs/common';
import { UserModule } from './users/user.module';
import { DivisionModule } from './divisions/division.module';
import { AuditModule } from './audit/audit.module';

@Module({
  imports: [UserModule, DivisionModule, AuditModule],
})
export class SettingsModule {}
