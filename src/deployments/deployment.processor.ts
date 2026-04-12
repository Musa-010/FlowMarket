import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DeploymentStatus } from '@prisma/client';
import { Job, Queue, Worker } from 'bullmq';
import { EmailService } from '../email/email.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EncryptionService } from './encryption/encryption.service';
import { N8nService } from './n8n/n8n.service';

interface DeploymentJobData {
  deploymentId: string;
}

@Injectable()
export class DeploymentProcessor implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DeploymentProcessor.name);
  private queue: Queue<DeploymentJobData> | null = null;
  private worker: Worker<DeploymentJobData> | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly n8nService: N8nService,
    private readonly encryptionService: EncryptionService,
    private readonly notificationsService: NotificationsService,
    private readonly emailService: EmailService,
  ) {}

  onModuleInit(): void {
    const connection = this.resolveRedisConnection();
    if (!connection) {
      this.logger.warn(
        'REDIS_URL is not configured. Deployment jobs will run inline without BullMQ queue.',
      );
      return;
    }

    this.queue = new Queue<DeploymentJobData>('deployment-jobs', {
      connection,
    });

    this.worker = new Worker<DeploymentJobData>(
      'deployment-jobs',
      async (job) => this.handleDeploymentJob(job),
      {
        connection,
        concurrency: 3,
      },
    );

    this.worker.on('failed', (job, error) => {
      this.logger.error(
        `Deployment job ${job?.id ?? 'unknown'} failed: ${error.message}`,
      );
    });
  }

  async onModuleDestroy(): Promise<void> {
    if (this.worker) {
      await this.worker.close();
      this.worker = null;
    }
    if (this.queue) {
      await this.queue.close();
      this.queue = null;
    }
  }

  async enqueueDeployment(deploymentId: string): Promise<void> {
    if (!this.queue) {
      await this.processDeploymentImmediately(deploymentId);
      return;
    }

    await this.queue.add(
      'deploy-workflow',
      { deploymentId },
      {
        attempts: 3,
        removeOnComplete: 200,
        removeOnFail: 500,
        backoff: {
          type: 'exponential',
          delay: 3000,
        },
      },
    );
  }

  async processDeploymentImmediately(deploymentId: string): Promise<void> {
    await this.executeDeployment(deploymentId);
  }

  private async handleDeploymentJob(
    job: Job<DeploymentJobData>,
  ): Promise<void> {
    await this.executeDeployment(job.data.deploymentId);
  }

  private async executeDeployment(deploymentId: string): Promise<void> {
    const start = Date.now();
    const deployment = await this.prisma.deployment.findUnique({
      where: { id: deploymentId },
      include: {
        workflow: true,
        user: true,
      },
    });

    if (!deployment) {
      return;
    }

    try {
      const config =
        deployment.configEncrypted &&
        deployment.configIv &&
        deployment.configAuthTag
          ? this.encryptionService.decryptObject({
              encrypted: deployment.configEncrypted,
              iv: deployment.configIv,
              authTag: deployment.configAuthTag,
            })
          : {};

      const n8nWorkflowId =
        deployment.n8nWorkflowId ??
        (
          await this.n8nService.createWorkflowFromTemplate({
            workflow: deployment.workflow,
            userId: deployment.userId,
            config,
          })
        ).id;

      await this.n8nService.setWorkflowActive(n8nWorkflowId, true);

      const durationMs = Date.now() - start;

      await this.prisma.$transaction([
        this.prisma.deployment.update({
          where: { id: deployment.id },
          data: {
            status: DeploymentStatus.ACTIVE,
            n8nWorkflowId,
            lastRunAt: new Date(),
            totalExecutions: {
              increment: 1,
            },
          },
        }),
        this.prisma.executionLog.create({
          data: {
            deploymentId: deployment.id,
            success: true,
            durationMs,
            payload: {
              action: 'deployment-activation',
              n8nWorkflowId,
            },
          },
        }),
      ]);

      await this.notificationsService.createNotification(
        deployment.userId,
        {
          title: 'Deployment Active',
          body: `${deployment.workflow.title} is now running.`,
          type: 'DEPLOYMENT',
          data: {
            deploymentId: deployment.id,
            status: DeploymentStatus.ACTIVE,
          },
        },
        true,
      );

      await this.emailService.sendDeploymentActiveEmail({
        userId: deployment.userId,
        workflowTitle: deployment.workflow.title,
        deploymentId: deployment.id,
      });
    } catch (error) {
      const durationMs = Date.now() - start;
      const message =
        error instanceof Error ? error.message : 'Unknown deployment failure';

      await this.prisma.$transaction([
        this.prisma.deployment.update({
          where: { id: deployment.id },
          data: {
            status: DeploymentStatus.FAILED,
          },
        }),
        this.prisma.executionLog.create({
          data: {
            deploymentId: deployment.id,
            success: false,
            durationMs,
            errorMessage: message,
            payload: {
              action: 'deployment-activation',
            },
          },
        }),
      ]);

      await this.notificationsService.createNotification(
        deployment.userId,
        {
          title: 'Deployment Failed',
          body: `${deployment.workflow.title} failed to deploy.`,
          type: 'DEPLOYMENT',
          data: {
            deploymentId: deployment.id,
            status: DeploymentStatus.FAILED,
          },
        },
        true,
      );

      await this.emailService.sendDeploymentFailedEmail({
        userId: deployment.userId,
        workflowTitle: deployment.workflow.title,
        deploymentId: deployment.id,
        failureReason: message,
      });

      throw error;
    }
  }

  private resolveRedisConnection(): {
    host: string;
    port: number;
    password?: string;
    username?: string;
    db?: number;
  } | null {
    const redisUrl = this.configService.get<string>('REDIS_URL');
    if (!redisUrl) {
      return null;
    }

    try {
      const url = new URL(redisUrl);
      return {
        host: url.hostname,
        port: Number(url.port || '6379'),
        password: url.password || undefined,
        username: url.username || undefined,
        db: url.pathname ? Number(url.pathname.replace('/', '') || '0') : 0,
      };
    } catch (error) {
      this.logger.error(
        `REDIS_URL is invalid (${redisUrl}): ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
      return null;
    }
  }
}
