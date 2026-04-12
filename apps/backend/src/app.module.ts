import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// Core modules
import { AppConfigModule } from './core/config/config.module';
import { PrismaModule } from './core/database/prisma.module';
import { AuthModule } from './core/auth/auth.module';
import { NotificationModule } from './core/notifications/notification.module';

// Feature modules
import { DashboardModule } from './modules/dashboards/dashboard.module';
import { AssetModule } from './modules/assets/asset.module';
import { TransactionModule } from './modules/transactions/transaction.module';
import { CustomerModule } from './modules/customers/customer.module';
import { SettingsModule } from './modules/settings/settings.module';
import { UploadModule } from './modules/uploads/upload.module';

// Guards
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';

// Interceptors
import { AuditTrailInterceptor } from './common/interceptors/audit-trail.interceptor';

@Module({
  imports: [
    // Core infrastructure
    AppConfigModule,
    PrismaModule,
    AuthModule,
    NotificationModule,

    // Rate limiting (ADR: throttler for API protection)
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60000, limit: 100 }],
    }),

    // Feature modules (domain-driven)
    DashboardModule,
    AssetModule,
    TransactionModule,
    CustomerModule,
    SettingsModule,
    UploadModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Global JWT auth guard — all routes protected by default, use @Public() to opt out
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    // Global roles guard — use @Roles() decorator to restrict
    { provide: APP_GUARD, useClass: RolesGuard },
    // Global rate limiting
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    // Global audit trail — auto-logs all CUD operations
    { provide: APP_INTERCEPTOR, useClass: AuditTrailInterceptor },
  ],
})
export class AppModule {}
