import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ApprovalService, type ApprovalChainStep } from './approval.service';
import { AuthPermissions, CurrentUser } from '../../../common/decorators';
import { PERMISSIONS } from '../../../common/constants';
import { UserRole } from '../../../generated/prisma/client';

@ApiTags('Approval')
@ApiBearerAuth('access-token')
@Controller('approval')
export class ApprovalController {
  constructor(private readonly approvalService: ApprovalService) {}

  @Get('chain/:module/:creatorRole')
  @AuthPermissions(PERMISSIONS.REQUESTS_VIEW_ALL)
  @ApiOperation({
    summary: 'Preview approval chain for a given module and creator role',
  })
  getChainPreview(
    @Param('module') module: string,
    @Param('creatorRole') creatorRole: UserRole,
  ): ApprovalChainStep[] {
    return this.approvalService.buildApprovalChain(creatorRole, module);
  }

  @Get('pending')
  @AuthPermissions(PERMISSIONS.REQUESTS_VIEW_OWN)
  @ApiOperation({ summary: 'Get transactions pending my approval' })
  async getPendingApprovals(@CurrentUser() user: { id: number; role: string }) {
    return this.approvalService.getPendingApprovalsForUser(
      user.id,
      user.role as UserRole,
    );
  }
}
