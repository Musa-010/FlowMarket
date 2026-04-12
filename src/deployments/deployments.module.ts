import { Module } from '@nestjs/common';
import { DeploymentsService } from './deployments.service';
import { DeploymentsController } from './deployments.controller';
import { EncryptionService } from './encryption/encryption.service';
import { N8nService } from './n8n/n8n.service';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { DeploymentProcessor } from './deployment.processor';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [ConfigModule, PrismaModule, NotificationsModule, EmailModule],
  providers: [
    DeploymentsService,
    EncryptionService,
    N8nService,
    DeploymentProcessor,
  ],
  controllers: [DeploymentsController],
  exports: [DeploymentsService, EncryptionService, N8nService],
})
export class DeploymentsModule {}
