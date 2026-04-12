import { Controller } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { RepairService } from './repair.service';

/**
 * TODO: Implement endpoints setelah Repair Prisma model dibuat
 * Pattern: GET list, GET :uuid, POST create, PATCH :uuid,
 * PATCH :uuid/approve, PATCH :uuid/reject, PATCH :uuid/execute, PATCH :uuid/cancel
 */
@ApiTags('Repairs')
@ApiBearerAuth('access-token')
@Controller('repairs')
export class RepairController {
  constructor(private readonly repairService: RepairService) {}
}
