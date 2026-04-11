import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '../../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

function resolveConnectionString(): string {
  const url = process.env.DATABASE_URL ?? '';
  if (url.startsWith('prisma+postgres://')) {
    const apiKey = new URL(
      url.replace('prisma+postgres://', 'http://'),
    ).searchParams.get('api_key');
    if (apiKey) {
      const decoded = JSON.parse(
        Buffer.from(apiKey, 'base64').toString('utf-8'),
      );
      return decoded.databaseUrl;
    }
  }
  return url;
}

const adapter = new PrismaPg({ connectionString: resolveConnectionString() });

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Database connected');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Database disconnected');
  }
}
