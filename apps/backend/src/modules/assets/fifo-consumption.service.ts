import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { TrackingMethod, Prisma } from '../../generated/prisma/client';
import { UnitConversionService } from './unit-conversion.service';

/**
 * FIFO Material Consumption Service
 * Handles FIFO (First-In-First-Out) consumption algorithm for materials
 * Ref: ASSET_LIFECYCLE.md §6
 */
@Injectable()
export class FifoConsumptionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly unitConversion: UnitConversionService,
  ) {}

  /**
   * Consume material using FIFO algorithm
   * @param modelId Asset model ID to consume from
   * @param quantityNeeded Quantity or amount needed
   * @param reference Document reference (e.g., installation doc number)
   * @param movementType Type of movement (INSTALLATION, MAINTENANCE, etc.)
   * @param userId User ID creating the movement
   * @param tx Optional Prisma transaction client
   * @throws BadRequestException if stock insufficient
   */
  async consumeMaterial(
    modelId: number,
    quantityNeeded: number,
    reference: string,
    movementType: 'INSTALLATION' | 'MAINTENANCE',
    userId: number,
    tx?: Prisma.TransactionClient,
  ): Promise<{ consumed: number; movements: number[] }> {
    const prismaClient = tx || this.prisma;

    if (quantityNeeded <= 0) {
      throw new BadRequestException(
        'Jumlah yang dikonsumsi harus lebih besar dari 0',
      );
    }

    // Get model info to understand tracking method
    const model = await prismaClient.assetModel.findUnique({
      where: { id: modelId },
    });

    if (!model) {
      throw new BadRequestException(
        `Model aset dengan ID ${modelId} tidak ditemukan`,
      );
    }

    let remaining = quantityNeeded;
    const movementIds: number[] = [];

    // FIFO: oldest first (by createdAt)
    const availableAssets = await prismaClient.asset.findMany({
      where: {
        modelId,
        status: 'IN_STORAGE',
        isDeleted: false,
      },
      orderBy: { createdAt: 'asc' },
    });

    for (const asset of availableAssets) {
      if (remaining <= 0) break;

      // Determine available quantity based on tracking method
      const available =
        asset.trackingMethod === TrackingMethod.MEASUREMENT
          ? asset.currentBalance?.toNumber() || 0
          : asset.quantity || 0;

      if (available === 0) continue;

      const consumed = Math.min(available, remaining);
      remaining -= consumed;

      // Update asset with new balance
      const newBalance = available - consumed;
      const newStatus = newBalance === 0 ? 'CONSUMED' : (asset.status as any);

      await prismaClient.asset.update({
        where: { id: asset.id },
        data: {
          ...(asset.trackingMethod === TrackingMethod.MEASUREMENT
            ? { currentBalance: new Prisma.Decimal(newBalance) }
            : { quantity: Math.round(newBalance) }),
          status: newStatus,
          updatedAt: new Date(),
        },
      });

      // Create stock movement record
      const movement = await prismaClient.stockMovement.create({
        data: {
          assetId: asset.id,
          type:
            movementType === 'INSTALLATION' ? 'INSTALLATION' : 'MAINTENANCE',
          quantity: -consumed,
          reference,
          note: `FIFO consumption: ${consumed} dari batch ${asset.code}`,
          createdById: userId,
        },
      });

      movementIds.push(movement.id);
    }

    if (remaining > 0) {
      throw new BadRequestException(
        `Stok tidak mencukupi untuk model ${model.name}. ` +
          `Dibutuhkan: ${quantityNeeded}, tersedia: ${quantityNeeded - remaining}. ` +
          `Masih kurang: ${remaining} unit.`,
      );
    }

    return {
      consumed: quantityNeeded,
      movements: movementIds,
    };
  }

  /**
   * Consume material with automatic container → base unit conversion.
   * If the model has containerUnit/containerSize configured, the input
   * quantity is treated as container units and converted to base units
   * before FIFO consumption.
   */
  async consumeMaterialWithConversion(
    modelId: number,
    quantity: number,
    isContainerUnit: boolean,
    reference: string,
    movementType: 'INSTALLATION' | 'MAINTENANCE',
    userId: number,
    tx?: Prisma.TransactionClient,
  ): Promise<{ consumed: number; baseUnit: string; movements: number[] }> {
    let baseQuantity = quantity;
    let baseUnit = 'pcs';

    if (isContainerUnit) {
      const conversion = await this.unitConversion.toBaseUnit(
        modelId,
        quantity,
      );
      baseQuantity = conversion.baseQuantity;
      baseUnit = conversion.baseUnit;
    } else {
      const model = await (tx || this.prisma).assetModel.findUnique({
        where: { id: modelId },
        select: { unit: true },
      });
      baseUnit = model?.unit ?? 'pcs';
    }

    const result = await this.consumeMaterial(
      modelId,
      baseQuantity,
      reference,
      movementType,
      userId,
      tx,
    );

    return {
      consumed: result.consumed,
      baseUnit,
      movements: result.movements,
    };
  }

  /**
   * Calculate available stock for a model
   * Handles both COUNT and MEASUREMENT tracking methods
   */
  async calculateAvailableStock(modelId: number): Promise<{
    count: number;
    measurement: number;
    total: number;
  }> {
    const model = await this.prisma.assetModel.findUnique({
      where: { id: modelId },
    });

    if (!model) {
      return { count: 0, measurement: 0, total: 0 };
    }

    const assets = await this.prisma.asset.findMany({
      where: {
        modelId,
        status: 'IN_STORAGE',
        isDeleted: false,
      },
    });

    let totalCount = 0;
    let totalMeasurement = 0;

    for (const asset of assets) {
      if (asset.trackingMethod === TrackingMethod.MEASUREMENT) {
        totalMeasurement += asset.currentBalance?.toNumber() || 0;
      } else {
        totalCount += asset.quantity || 0;
      }
    }

    return {
      count: totalCount,
      measurement: totalMeasurement,
      total: totalCount + totalMeasurement,
    };
  }
}
