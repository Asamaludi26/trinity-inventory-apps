import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { MovementType } from '../../../generated/prisma/client';

interface CreateStockMovementInput {
  assetId: string;
  type: MovementType;
  quantity?: number;
  reference?: string;
  note?: string;
  createdById: number;
}

@Injectable()
export class StockMovementService {
  private readonly logger = new Logger(StockMovementService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a stock movement record.
   * Can be called standalone or within a Prisma transaction (pass tx).
   */
  async create(
    input: CreateStockMovementInput,
    tx?: Parameters<Parameters<PrismaService['$transaction']>[0]>[0],
  ) {
    const client = tx ?? this.prisma;
    const record = await client.stockMovement.create({
      data: {
        assetId: input.assetId,
        type: input.type,
        quantity: input.quantity ?? 1,
        reference: input.reference,
        note: input.note,
        createdById: input.createdById,
      },
    });

    this.logger.log(
      `StockMovement created: ${input.type} asset=${input.assetId} ref=${input.reference ?? '-'}`,
    );

    return record;
  }

  /**
   * Create multiple stock movement records in batch.
   */
  async createMany(
    inputs: CreateStockMovementInput[],
    tx?: Parameters<Parameters<PrismaService['$transaction']>[0]>[0],
  ) {
    return Promise.all(inputs.map((input) => this.create(input, tx)));
  }

  /**
   * Get stock movements for a specific asset.
   */
  async findByAsset(assetId: string) {
    return this.prisma.stockMovement.findMany({
      where: { assetId },
      orderBy: { createdAt: 'desc' },
      include: { createdBy: { select: { id: true, fullName: true } } },
    });
  }
}
