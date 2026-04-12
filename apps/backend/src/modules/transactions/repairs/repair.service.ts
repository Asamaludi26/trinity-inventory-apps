import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';

/**
 * TODO: Implement RepairService setelah Repair Prisma model dibuat di schema/transaction.prisma
 * Model Repair harus memiliki: id, code, assetId, description, condition, status, note,
 * createdById, approvalChain, rejectionReason, isDeleted, version, timestamps
 *
 * Endpoint pattern (DRY, sama dengan request/loan/return/handover):
 * - findAll(filter) + findOne(id)
 * - create(dto, userId, userRole) → generate code RP-YYYYMMDD-XXXX
 * - update(id, dto) → only PENDING
 * - approve(id), reject(id, reason), execute(id), cancel(id, userId)
 */
@Injectable()
export class RepairService {
  constructor(private readonly prisma: PrismaService) {}
}
