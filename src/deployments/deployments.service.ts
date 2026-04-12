import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DeploymentStatus, Prisma, WorkflowStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { mapWorkflow } from '../workflows/workflow.mapper';
import { ConfigureDeploymentDto } from './dto/configure-deployment.dto';
import { CreateDeploymentDto } from './dto/create-deployment.dto';
import { QueryDeploymentLogsDto } from './dto/query-deployment-logs.dto';
import { DeploymentProcessor } from './deployment.processor';
import { EncryptionService } from './encryption/encryption.service';
import { N8nService } from './n8n/n8n.service';

@Injectable()
export class DeploymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly encryptionService: EncryptionService,
    private readonly deploymentProcessor: DeploymentProcessor,
    private readonly n8nService: N8nService,
  ) {}

  async getDeployments(userId: string) {
    const deployments = await this.prisma.deployment.findMany({
      where: { userId },
      include: { workflow: { include: { seller: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return deployments.map((deployment) => this.mapDeployment(deployment));
  }

  async getDeploymentById(userId: string, deploymentId: string) {
    const deployment = await this.prisma.deployment.findUnique({
      where: { id: deploymentId },
      include: { workflow: { include: { seller: true } } },
    });

    if (!deployment) {
      throw new NotFoundException('Deployment not found');
    }
    if (deployment.userId !== userId) {
      throw new ForbiddenException('You do not own this deployment');
    }

    return this.mapDeployment(deployment);
  }

  async createDeployment(userId: string, dto: CreateDeploymentDto) {
    const workflow = await this.prisma.workflow.findUnique({
      where: { id: dto.workflowId },
    });
    if (!workflow || workflow.status !== WorkflowStatus.APPROVED) {
      throw new NotFoundException('Approved workflow not found');
    }

    const canDeployOwnWorkflow = workflow.sellerId === userId;
    if (!canDeployOwnWorkflow) {
      const purchase = await this.prisma.purchase.findFirst({
        where: { userId, workflowId: workflow.id },
        select: { id: true },
      });
      if (!purchase) {
        throw new ForbiddenException(
          'You can only deploy workflows you purchased or own',
        );
      }
    }

    const encrypted = dto.config
      ? this.encryptionService.encryptObject(dto.config)
      : null;

    const deployment = await this.prisma.deployment.create({
      data: {
        userId,
        workflowId: workflow.id,
        status: DeploymentStatus.CONFIGURING,
        configEncrypted: encrypted?.encrypted ?? null,
        configIv: encrypted?.iv ?? null,
        configAuthTag: encrypted?.authTag ?? null,
      },
      include: { workflow: { include: { seller: true } } },
    });

    await this.deploymentProcessor.enqueueDeployment(deployment.id);
    return this.mapDeployment(deployment);
  }

  async configureDeployment(
    userId: string,
    deploymentId: string,
    dto: ConfigureDeploymentDto,
  ) {
    const deployment = await this.ensureOwnedDeployment(userId, deploymentId);
    const encrypted = this.encryptionService.encryptObject(dto.config);

    const updated = await this.prisma.deployment.update({
      where: { id: deployment.id },
      data: {
        status: DeploymentStatus.CONFIGURING,
        configEncrypted: encrypted.encrypted,
        configIv: encrypted.iv,
        configAuthTag: encrypted.authTag,
      },
      include: { workflow: { include: { seller: true } } },
    });

    await this.deploymentProcessor.enqueueDeployment(updated.id);
    return this.mapDeployment(updated);
  }

  async pauseDeployment(userId: string, deploymentId: string) {
    const deployment = await this.ensureOwnedDeployment(userId, deploymentId);

    if (deployment.n8nWorkflowId) {
      await this.n8nService.setWorkflowActive(deployment.n8nWorkflowId, false);
    }

    const updated = await this.prisma.deployment.update({
      where: { id: deployment.id },
      data: { status: DeploymentStatus.PAUSED },
      include: { workflow: { include: { seller: true } } },
    });

    return this.mapDeployment(updated);
  }

  async resumeDeployment(userId: string, deploymentId: string) {
    const deployment = await this.ensureOwnedDeployment(userId, deploymentId);

    await this.deploymentProcessor.enqueueDeployment(deployment.id);

    const updated = await this.prisma.deployment.update({
      where: { id: deployment.id },
      data: { status: DeploymentStatus.CONFIGURING },
      include: { workflow: { include: { seller: true } } },
    });

    return this.mapDeployment(updated);
  }

  async stopDeployment(userId: string, deploymentId: string) {
    const deployment = await this.ensureOwnedDeployment(userId, deploymentId);

    if (deployment.n8nWorkflowId) {
      await this.n8nService.setWorkflowActive(deployment.n8nWorkflowId, false);
    }

    const updated = await this.prisma.deployment.update({
      where: { id: deployment.id },
      data: { status: DeploymentStatus.STOPPED },
      include: { workflow: { include: { seller: true } } },
    });

    return this.mapDeployment(updated);
  }

  async getDeploymentLogs(
    userId: string,
    deploymentId: string,
    query: QueryDeploymentLogsDto,
  ) {
    const deployment = await this.ensureOwnedDeployment(userId, deploymentId);

    const [storedLogs, remoteLogs] = await Promise.all([
      this.prisma.executionLog.findMany({
        where: { deploymentId: deployment.id },
        orderBy: { executedAt: 'desc' },
        take: query.limit,
      }),
      deployment.n8nWorkflowId
        ? this.n8nService.fetchExecutionLogs(
            deployment.n8nWorkflowId,
            query.limit,
          )
        : Promise.resolve([]),
    ]);

    const mappedStored = storedLogs.map((log) => ({
      id: log.id,
      deploymentId: deployment.id,
      success: log.success,
      durationMs: log.durationMs,
      errorMessage: log.errorMessage,
      executedAt: log.executedAt,
    }));

    const mappedRemote = remoteLogs.map((log) => ({
      id: `n8n-${log.id}`,
      deploymentId: deployment.id,
      success: log.success,
      durationMs: log.durationMs,
      errorMessage: log.errorMessage,
      executedAt: log.executedAt,
    }));

    const deduped = new Map(
      [...mappedRemote, ...mappedStored].map((item) => [item.id, item]),
    );

    return Array.from(deduped.values())
      .sort((a, b) => b.executedAt.getTime() - a.executedAt.getTime())
      .slice(0, query.limit);
  }

  private async ensureOwnedDeployment(userId: string, deploymentId: string) {
    const deployment = await this.prisma.deployment.findUnique({
      where: { id: deploymentId },
      include: { workflow: { include: { seller: true } } },
    });
    if (!deployment) {
      throw new NotFoundException('Deployment not found');
    }
    if (deployment.userId !== userId) {
      throw new ForbiddenException('You do not own this deployment');
    }
    return deployment;
  }

  private mapDeployment(
    deployment: Prisma.DeploymentGetPayload<{
      include: { workflow: { include: { seller: true } } };
    }>,
  ) {
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

    return {
      id: deployment.id,
      userId: deployment.userId,
      workflowId: deployment.workflowId,
      status: deployment.status,
      n8nWorkflowId: deployment.n8nWorkflowId,
      config,
      totalExecutions: deployment.totalExecutions,
      lastRunAt: deployment.lastRunAt,
      workflow: mapWorkflow(deployment.workflow),
      createdAt: deployment.createdAt,
      updatedAt: deployment.updatedAt,
    };
  }
}
