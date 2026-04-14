import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { FilterClientDto } from './dto/filter-client.dto';
import { Prisma } from '../../../generated/prisma/client';

@Injectable()
export class ClientService {
  constructor(private readonly prisma: PrismaService) {}

  private async generateCode(): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const count = await this.prisma.customer.count({
      where: { code: { startsWith: `CST-${dateStr}` } },
    });
    return `CST-${dateStr}-${String(count + 1).padStart(4, '0')}`;
  }

  async findAll(query: FilterClientDto) {
    const {
      page = 1,
      limit = 20,
      search,
      sortBy = 'name',
      sortOrder = 'asc',
      isActive,
    } = query;

    const where: Prisma.CustomerWhereInput = {
      isDeleted: false,
      ...(isActive !== undefined && { isActive }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { code: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const allowedSortFields = ['createdAt', 'name', 'code'];
    const orderField = allowedSortFields.includes(sortBy) ? sortBy : 'name';

    const [data, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [orderField]: sortOrder },
        include: {
          _count: {
            select: {
              installations: true,
              maintenances: true,
              dismantles: true,
              projects: true,
            },
          },
        },
      }),
      this.prisma.customer.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { uuid: id, isDeleted: false },
      include: {
        installations: {
          where: { isDeleted: false },
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
        maintenances: {
          where: { isDeleted: false },
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
        dismantles: {
          where: { isDeleted: false },
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            installations: { where: { isDeleted: false } },
            maintenances: { where: { isDeleted: false } },
            dismantles: { where: { isDeleted: false } },
            projects: { where: { isDeleted: false } },
          },
        },
      },
    });

    if (!customer) {
      throw new NotFoundException('Pelanggan tidak ditemukan');
    }
    return customer;
  }

  async create(dto: CreateClientDto) {
    const code = await this.generateCode();
    return this.prisma.customer.create({
      data: {
        code,
        isActive: false,
        ...dto,
      },
    });
  }

  async update(id: string, dto: UpdateClientDto) {
    await this.findOne(id);
    return this.prisma.customer.update({
      where: { uuid: id },
      data: dto,
    });
  }

  async remove(id: string) {
    const customer = await this.findOne(id);

    // T3-04: Deletion protection — check transaction history
    const hasHistory = await this.prisma.$transaction(async (tx) => {
      const [instCount, maintCount, dismCount] = await Promise.all([
        tx.installation.count({
          where: { customerId: customer.id, isDeleted: false },
        }),
        tx.maintenance.count({
          where: { customerId: customer.id, isDeleted: false },
        }),
        tx.dismantle.count({
          where: { customerId: customer.id, isDeleted: false },
        }),
      ]);
      return instCount + maintCount + dismCount > 0;
    });

    if (hasHistory) {
      throw new UnprocessableEntityException(
        'Pelanggan memiliki riwayat transaksi. Ubah status ke INACTIVE.',
      );
    }

    await this.prisma.customer.update({
      where: { uuid: id },
      data: { isDeleted: true },
    });
    return null;
  }

  /**
   * T3-02: Auto-activate customer when first installation completes
   */
  async activateOnInstallation(
    customerId: number,
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    const customer = await tx.customer.findUnique({
      where: { id: customerId },
    });
    if (customer && !customer.isActive) {
      await tx.customer.update({
        where: { id: customerId },
        data: { isActive: true },
      });
    }
  }

  /**
   * T3-02: Auto-deactivate customer when all assets dismantled
   */
  async deactivateOnDismantle(
    customerId: number,
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    // Count remaining IN_USE assets linked via installations for this customer
    const remainingAssets = await tx.installation.count({
      where: {
        customerId,
        status: 'COMPLETED',
        isDeleted: false,
        materials: {
          some: {
            model: {
              assets: {
                some: { status: 'IN_USE', isDeleted: false },
              },
            },
          },
        },
      },
    });

    // Also check dismantled items still IN_USE
    const inUseAssets = await tx.asset.count({
      where: {
        status: 'IN_USE',
        isDeleted: false,
        dismantleItems: {
          some: {
            dismantle: { customerId, isDeleted: false },
          },
        },
      },
    });

    if (remainingAssets === 0 && inUseAssets === 0) {
      await tx.customer.update({
        where: { id: customerId },
        data: { isActive: false },
      });
    }
  }
}
