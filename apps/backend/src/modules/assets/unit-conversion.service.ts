import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';

export interface ConversionResult {
  baseQuantity: number;
  baseUnit: string;
  containerQuantity: number;
  containerUnit: string;
}

/**
 * Unit Conversion Service
 * Converts between container units and base units for materials.
 * Example: 2 boxes × 100 pcs/box = 200 pcs
 */
@Injectable()
export class UnitConversionService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Convert container quantity to base unit quantity
   * @param modelId - AssetModel ID
   * @param containerQuantity - Quantity in container units (e.g., 2 boxes)
   * @returns Base unit quantity (e.g., 200 pcs)
   */
  async toBaseUnit(
    modelId: number,
    containerQuantity: number,
  ): Promise<ConversionResult> {
    const model = await this.prisma.assetModel.findUnique({
      where: { id: modelId },
      select: {
        unit: true,
        containerUnit: true,
        containerSize: true,
        name: true,
      },
    });

    if (!model) {
      throw new BadRequestException(
        `Model aset dengan ID ${modelId} tidak ditemukan`,
      );
    }

    // No container conversion configured — return as-is
    if (!model.containerUnit || !model.containerSize) {
      return {
        baseQuantity: containerQuantity,
        baseUnit: model.unit ?? 'pcs',
        containerQuantity,
        containerUnit: model.unit ?? 'pcs',
      };
    }

    const size = model.containerSize.toNumber();
    if (size <= 0) {
      throw new BadRequestException(
        `Ukuran kontainer untuk model ${model.name} tidak valid (${size})`,
      );
    }

    const baseQuantity = containerQuantity * size;

    return {
      baseQuantity,
      baseUnit: model.unit ?? 'pcs',
      containerQuantity,
      containerUnit: model.containerUnit,
    };
  }

  /**
   * Convert base unit quantity to container units
   * @param modelId - AssetModel ID
   * @param baseQuantity - Quantity in base units (e.g., 200 pcs)
   * @returns Container quantity (e.g., 2 boxes)
   */
  async toContainerUnit(
    modelId: number,
    baseQuantity: number,
  ): Promise<ConversionResult> {
    const model = await this.prisma.assetModel.findUnique({
      where: { id: modelId },
      select: {
        unit: true,
        containerUnit: true,
        containerSize: true,
        name: true,
      },
    });

    if (!model) {
      throw new BadRequestException(
        `Model aset dengan ID ${modelId} tidak ditemukan`,
      );
    }

    if (!model.containerUnit || !model.containerSize) {
      return {
        baseQuantity,
        baseUnit: model.unit ?? 'pcs',
        containerQuantity: baseQuantity,
        containerUnit: model.unit ?? 'pcs',
      };
    }

    const size = model.containerSize.toNumber();
    if (size <= 0) {
      throw new BadRequestException(
        `Ukuran kontainer untuk model ${model.name} tidak valid (${size})`,
      );
    }

    const containerQuantity = baseQuantity / size;

    return {
      baseQuantity,
      baseUnit: model.unit ?? 'pcs',
      containerQuantity,
      containerUnit: model.containerUnit,
    };
  }

  /**
   * Format a quantity with its unit label
   * e.g., "200 pcs (2 box)"
   */
  formatWithConversion(result: ConversionResult): string {
    if (result.baseUnit === result.containerUnit) {
      return `${result.baseQuantity} ${result.baseUnit}`;
    }
    return `${result.baseQuantity} ${result.baseUnit} (${result.containerQuantity} ${result.containerUnit})`;
  }
}
