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
import { AuthPermissions, CurrentUser } from '../../common/decorators';
import { PERMISSIONS } from '../../common/constants';
import { UserRole } from '../../generated/prisma/client';
import { DashboardQueryDto } from './dto';

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
  @AuthPermissions(PERMISSIONS.DASHBOARD_VIEW)
  @ApiOperation({ summary: 'Statistik utama dashboard — overview sistem' })
  @ApiQuery({
    name: 'dateFrom',
    required: false,
    description: 'Filter tanggal mulai (ISO)',
  })
  @ApiQuery({
    name: 'dateTo',
    required: false,
    description: 'Filter tanggal akhir (ISO)',
  })
  @ApiQuery({
    name: 'preset',
    required: false,
    enum: ['today', '7d', '30d', '3m', '6m', '1y'],
  })
  @ApiResponse({ status: 200, description: 'Statistik utama berhasil diambil' })
  async getStats(@Query() query: DashboardQueryDto) {
    return this.dashboardService.getStats(query);
  }

  @Get('recent-activity')
  @AuthPermissions(PERMISSIONS.REPORTS_VIEW)
  @ApiOperation({ summary: 'Aktivitas terbaru seluruh sistem' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Data aktivitas berhasil diambil' })
  async getRecentActivity(
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.dashboardService.getRecentActivity(limit);
  }

  @Get('asset-trend')
  @AuthPermissions(PERMISSIONS.REPORTS_VIEW)
  @ApiOperation({ summary: 'Tren aset per bulan' })
  @ApiQuery({ name: 'months', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Data tren berhasil diambil' })
  async getAssetTrend(
    @Query('months', new DefaultValuePipe(6), ParseIntPipe) months: number,
  ) {
    return this.dashboardService.getAssetTrend(months);
  }

  @Get('category-distribution')
  @AuthPermissions(PERMISSIONS.REPORTS_VIEW)
  @ApiOperation({ summary: 'Distribusi aset per kategori' })
  @ApiResponse({ status: 200, description: 'Data distribusi berhasil diambil' })
  async getCategoryDistribution() {
    return this.dashboardService.getCategoryDistribution();
  }

  // ──────────────── Finance Endpoints ────────────────

  @Get('finance/stats')
  @AuthPermissions(PERMISSIONS.ASSETS_VIEW_PRICE)
  @ApiOperation({ summary: 'Statistik keuangan — pembelian & depresiasi' })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  @ApiQuery({
    name: 'preset',
    required: false,
    enum: ['today', '7d', '30d', '3m', '6m', '1y'],
  })
  @ApiResponse({
    status: 200,
    description: 'Statistik keuangan berhasil diambil',
  })
  async getFinanceStats(@Query() query: DashboardQueryDto) {
    return this.dashboardService.getFinanceStats(query);
  }

  @Get('finance/spending-by-category')
  @AuthPermissions(PERMISSIONS.ASSETS_VIEW_PRICE)
  @ApiOperation({ summary: 'Pengeluaran pembelian dikelompokkan per kategori' })
  @ApiResponse({
    status: 200,
    description: 'Data pengeluaran per kategori berhasil diambil',
  })
  async getSpendingByCategory() {
    return this.dashboardService.getSpendingByCategory();
  }

  // ──────────────── Operations Endpoints ────────────────

  @Get('operations/stats')
  @AuthPermissions(PERMISSIONS.STOCK_VIEW)
  @ApiOperation({ summary: 'Statistik operasional — stok & transaksi aktif' })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  @ApiQuery({
    name: 'preset',
    required: false,
    enum: ['today', '7d', '30d', '3m', '6m', '1y'],
  })
  @ApiResponse({
    status: 200,
    description: 'Statistik operasional berhasil diambil',
  })
  async getOperationsStats(@Query() query: DashboardQueryDto) {
    return this.dashboardService.getOperationsStats(query);
  }

  @Get('operations/daily-ops')
  @AuthPermissions(PERMISSIONS.STOCK_VIEW)
  @ApiOperation({ summary: 'Ringkasan aktivitas operasional hari ini' })
  @ApiResponse({
    status: 200,
    description: 'Data aktivitas hari ini berhasil diambil',
  })
  async getDailyOps() {
    return this.dashboardService.getDailyOps();
  }

  @Get('operations/stock-alerts')
  @AuthPermissions(PERMISSIONS.STOCK_MANAGE)
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
  @AuthPermissions(PERMISSIONS.ASSETS_VIEW_DIVISION)
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
  @AuthPermissions(PERMISSIONS.ASSETS_VIEW_DIVISION)
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
  @AuthPermissions(PERMISSIONS.DASHBOARD_VIEW)
  @ApiOperation({ summary: 'Statistik pribadi — aset & pinjaman saya' })
  @ApiResponse({
    status: 200,
    description: 'Statistik pribadi berhasil diambil',
  })
  async getPersonalStats(@CurrentUser() user: DashboardUser) {
    return this.dashboardService.getPersonalStats(user.id);
  }

  @Get('personal/assets')
  @AuthPermissions(PERMISSIONS.DASHBOARD_VIEW)
  @ApiOperation({ summary: 'Daftar aset yang saya pegang' })
  @ApiResponse({
    status: 200,
    description: 'Data aset pribadi berhasil diambil',
  })
  async getPersonalAssets(@CurrentUser() user: DashboardUser) {
    return this.dashboardService.getPersonalAssets(user.id);
  }

  @Get('personal/pending-returns')
  @AuthPermissions(PERMISSIONS.DASHBOARD_VIEW)
  @ApiOperation({ summary: 'Daftar pinjaman yang perlu dikembalikan' })
  @ApiResponse({
    status: 200,
    description: 'Data pengembalian berhasil diambil',
  })
  async getPersonalPendingReturns(@CurrentUser() user: DashboardUser) {
    return this.dashboardService.getPersonalPendingReturns(user.id);
  }
}
