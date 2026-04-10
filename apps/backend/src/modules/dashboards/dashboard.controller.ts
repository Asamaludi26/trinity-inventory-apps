import { Controller, Get } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { CurrentUser } from '../../common/decorators';

@Controller('api/v1/dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  async getStats(@CurrentUser() user: { id: number; role: string }) {
    return this.dashboardService.getStatsByRole(user.id, user.role);
  }
}
