import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { AuditService, FilterAuditDto } from './audit.service';
import { AuthPermissions } from '../../../common/decorators';
import { PERMISSIONS } from '../../../common/constants';

@ApiTags('Audit')
@ApiBearerAuth('access-token')
@Controller('settings/audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @AuthPermissions(PERMISSIONS.SYSTEM_AUDIT_LOG)
  @ApiOperation({ summary: 'List activity log' })
  @ApiResponse({
    status: 200,
    description: 'Berhasil mengambil data audit log',
  })
  async findAll(@Query() query: FilterAuditDto) {
    return this.auditService.findAll(query);
  }
}
