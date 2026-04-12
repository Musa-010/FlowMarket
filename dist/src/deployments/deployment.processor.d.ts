import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailService } from '../email/email.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EncryptionService } from './encryption/encryption.service';
import { N8nService } from './n8n/n8n.service';
export declare class DeploymentProcessor implements OnModuleInit, OnModuleDestroy {
    private readonly configService;
    private readonly prisma;
    private readonly n8nService;
    private readonly encryptionService;
    private readonly notificationsService;
    private readonly emailService;
    private readonly logger;
    private queue;
    private worker;
    constructor(configService: ConfigService, prisma: PrismaService, n8nService: N8nService, encryptionService: EncryptionService, notificationsService: NotificationsService, emailService: EmailService);
    onModuleInit(): void;
    onModuleDestroy(): Promise<void>;
    enqueueDeployment(deploymentId: string): Promise<void>;
    processDeploymentImmediately(deploymentId: string): Promise<void>;
    private handleDeploymentJob;
    private executeDeployment;
    private resolveRedisConnection;
}
