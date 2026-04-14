import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { WhatsAppService } from './whatsapp.service';

@Global()
@Module({
  imports: [JwtModule],
  controllers: [NotificationController],
  providers: [NotificationService, WhatsAppService],
  exports: [NotificationService, WhatsAppService],
})
export class NotificationModule {}
