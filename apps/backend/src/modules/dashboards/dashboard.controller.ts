import {
  Controller,
  Get,
  Query,
  ForbiddenException,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
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

  // ──────────────── Superadmin Endpoints ────────────────

  @Get('stats')
  @Roles(UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Statistik utama dashboard — overview sistem' })
  @ApiResponse({ status: 200, description: 'Statistik utama berhasil diambil' })
  async getStats() {
    return this.dashboardService.getStats();
  }

  @Get('recent-activity')
  @Roles(UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Aktivitas terbaru seluruh sistem' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Data aktivitas berhasil diambil' })
  async getRecentActivity(
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.dashboardService.getRecentActivity(limit);
  }

  @Get('asset-trend')
  @Roles(UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Tren aset per bulan' })
  @ApiQuery({ name: 'months', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Data tren berhasil diambil' })
  async getAssetTrend(
    @Query('months', new DefaultValuePipe(6), ParseIntPipe) months: number,
  ) {
    return this.dashboardService.getAssetTrend(months);
  }

  @Get('category-distribution')
  @Roles(UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Distribusi aset per kategori' })
  @ApiResponse({ status: 200, description: 'Data distribusi berhasil diambil' })
  async getCategoryDistribution() {
    return this.dashboardService.getCategoryDistribution();
  }

  // ──────────────── Finance Endpoints ────────────────

  @Get('finance/stats')
  @Roles(UserRole.ADMIN_PURCHASE, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Statistik keuangan — pembelian & depresiasi' })
  @ApiResponse({
    status: 200,
    description: 'Statistik keuangan berhasil diambil',
  })
  async getFinanceStats() {
    return this.dashboardService.getFinanceStats();
  }

  // ──────────────── Operations Endpoints ────────────────

  @Get('operations/stats')
  @Roles(UserRole.ADMIN_LOGISTIK, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Statistik operasional — stok & transaksi aktif' })
  @ApiResponse({
    status: 200,
    description: 'Statistik operasional berhasil diambil',
  })
  async getOperationsStats() {
    return this.dashboardService.getOperationsStats();
  }

  @Get('operations/stock-alerts')
  @Roles(UserRole.ADMIN_LOGISTIK, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Peringatan stok rendah' })
  @ApiResponse({
    status: 200,
    description: 'Data peringatan stok berhasil diambil',
  })
  async getStockAlerts() {
    return this.dashboardService.getStockAlerts();
  }

  // ──────────────── Division Endpoints ────────────────

  @Get('division/stats')
  @Roles(UserRole.LEADER, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Statistik divisi — aset & transaksi tim' })
  @ApiResponse({
    status: 200,
    description: 'Statistik divisi berhasil diambil',
  })
  async getDivisionStats(@CurrentUser() user: DashboardUser) {
    if (!user.divisionId) {
      throw new ForbiddenException('User belum memiliki divisi');
    }
    return this.dashboardService.getDivisionStats(user.id, user.divisionId);
  }

  @Get('division/members')
  @Roles(UserRole.LEADER, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Daftar member divisi beserta aset' })
  @ApiResponse({ status: 200, description: 'Data member berhasil diambil' })
  async getDivisionMembers(@CurrentUser() user: DashboardUser) {
    if (!user.divisionId) {
      throw new ForbiddenException('User belum memiliki divisi');
    }
    return this.dashboardService.getDivisionMembers(user.divisionId);
  }

  // ──────────────── Personal Endpoints ────────────────

  @Get('personal/stats')
  @ApiOperation({ summary: 'Statistik pribadi — aset & pinjaman saya' })
  @ApiResponse({
    status: 200,
    description: 'Statistik pribadi berhasil diambil',
  })
  async getPersonalStats(@CurrentUser() user: DashboardUser) {
    return this.dashboardService.getPersonalStats(user.id);
  }

  @Get('personal/assets')
  @ApiOperation({ summary: 'Daftar aset yang saya pegang' })
  @ApiResponse({
    status: 200,
    description: 'Data aset pribadi berhasil diambil',
  })
  async getPersonalAssets(@CurrentUser() user: DashboardUser) {
    return this.dashboardService.getPersonalAssets(user.id);
  }

  @Get('personal/pending-returns')
  @ApiOperation({ summary: 'Daftar pinjaman yang perlu dikembalikan' })
  @ApiResponse({
    status: 200,
    description: 'Data pengembalian berhasil diambil',
  })
  async getPersonalPendingReturns(@CurrentUser() user: DashboardUser) {
    return this.dashboardService.getPersonalPendingReturns(user.id);
  }
}
