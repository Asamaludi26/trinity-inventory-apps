import { Controller, Get, Param } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { StockMovementService } from './stock-movement.service';
import { AuthPermissions } from '../../../common/decorators';
import { PERMISSIONS } from '../../../common/constants';

@ApiTags('Stock Movements')
@ApiBearerAuth('access-token')
@Controller('stock-movements')
export class StockMovementController {
  constructor(private readonly stockMovementService: StockMovementService) {}

  @Get('asset/:assetId')
  @AuthPermissions(PERMISSIONS.STOCK_VIEW)
  @ApiOperation({ summary: 'Get stock movements for a specific asset' })
  @ApiResponse({ status: 200, description: 'Stock movements retrieved' })
  async findByAsset(@Param('assetId') assetId: string) {
    return this.stockMovementService.findByAsset(assetId);
  }
}
