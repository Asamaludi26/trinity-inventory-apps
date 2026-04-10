import { Module } from '@nestjs/common';
import { CustomerModule as ClientModule } from './clients/client.module';
import { InstallationModule } from './installations/installation.module';
import { MaintenanceModule } from './maintenance/maintenance.module';
import { DismantleModule } from './dismantles/dismantle.module';

@Module({
  imports: [
    ClientModule,
    InstallationModule,
    MaintenanceModule,
    DismantleModule,
  ],
})
export class CustomerModule {}
