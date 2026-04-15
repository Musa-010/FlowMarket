import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit(): Promise<void> {
    try {
      await this.$connect();
      this.logger.log('Prisma Engine connected successfully.');
    } catch (error) {
      this.logger.error(
        'Prisma failed to initialize during startup. Please check your DATABASE_URL environment variable and container memory.',
        error.stack || error,
      );
      process.exit(1); 
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
