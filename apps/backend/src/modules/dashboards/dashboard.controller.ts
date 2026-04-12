import { Controller, Get, ForbiddenException } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { CurrentUser, Roles } from '../../common/decorators';
import { UserRole } from '../../generated/prisma/client';

interface DashboardUser {
  id: number;
  role: UserRole;
  divisionId: number | null;
}

@ApiTags('Dashboard')
@ApiBearerAuth('access-token')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('main')
  @Roles(UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Dashboard utama — overview seluruh sistem' })
  @ApiResponse({ status: 200, description: 'Statistik utama berhasil diambil' })
  @ApiResponse({ status: 403, description: 'Hanya Superadmin' })
  async getMainDashboard() {
    return this.dashboardService.getMainDashboard();
  }

  @Get('finance')
  @Roles(UserRole.ADMIN_PURCHASE, UserRole.SUPERADMIN)
  @ApiOperation({
    summary: 'Dashboard keuangan — ringkasan pembelian & depresiasi',
  })
  @ApiResponse({
    status: 200,
    description: 'Statistik keuangan berhasil diambil',
  })
  @ApiResponse({
    status: 403,
    description: 'Hanya Admin Purchase atau Superadmin',
  })
  async getFinanceDashboard() {
    return this.dashboardService.getFinanceDashboard();
  }

  @Get('operations')
  @Roles(UserRole.ADMIN_LOGISTIK, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Dashboard operasional — stok, transaksi aktif' })
  @ApiResponse({
    status: 200,
    description: 'Statistik operasional berhasil diambil',
  })
  @ApiResponse({
    status: 403,
    description: 'Hanya Admin Logistik atau Superadmin',
  })
  async getOperationsDashboard() {
    return this.dashboardService.getOperationsDashboard();
  }

  @Get('division')
  @Roles(UserRole.LEADER, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Dashboard divisi — aset & transaksi divisi' })
  @ApiResponse({
    status: 200,
    description: 'Statistik divisi berhasil diambil',
  })
  @ApiResponse({ status: 403, description: 'Hanya Leader atau Superadmin' })
  async getDivisionDashboard(@CurrentUser() user: DashboardUser) {
    if (!user.divisionId) {
      throw new ForbiddenException('User belum memiliki divisi');
    }
    return this.dashboardService.getDivisionDashboard(user.id, user.divisionId);
  }

  @Get('personal')
  @ApiOperation({ summary: 'Dashboard pribadi — aset yang dipegang, riwayat' })
  @ApiResponse({
    status: 200,
    description: 'Statistik pribadi berhasil diambil',
  })
  async getPersonalDashboard(@CurrentUser() user: DashboardUser) {
    return this.dashboardService.getPersonalDashboard(user.id);
  }
}
