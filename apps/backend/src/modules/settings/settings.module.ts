import { Module } from '@nestjs/common';
import { UserModule } from './users/user.module';
import { DivisionModule } from './divisions/division.module';
import { AuditModule } from './audit/audit.module';
import { ProfileModule } from './profile/profile.module';

@Module({
  imports: [UserModule, DivisionModule, AuditModule, ProfileModule],
})
export class SettingsModule {}
