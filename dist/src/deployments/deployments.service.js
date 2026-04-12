"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeploymentsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const workflow_mapper_1 = require("../workflows/workflow.mapper");
const deployment_processor_1 = require("./deployment.processor");
const encryption_service_1 = require("./encryption/encryption.service");
const n8n_service_1 = require("./n8n/n8n.service");
let DeploymentsService = class DeploymentsService {
    prisma;
    encryptionService;
    deploymentProcessor;
    n8nService;
    constructor(prisma, encryptionService, deploymentProcessor, n8nService) {
        this.prisma = prisma;
        this.encryptionService = encryptionService;
        this.deploymentProcessor = deploymentProcessor;
        this.n8nService = n8nService;
    }
    async getDeployments(userId) {
        const deployments = await this.prisma.deployment.findMany({
            where: { userId },
            include: { workflow: { include: { seller: true } } },
            orderBy: { createdAt: 'desc' },
        });
        return deployments.map((deployment) => this.mapDeployment(deployment));
    }
    async getDeploymentById(userId, deploymentId) {
        const deployment = await this.prisma.deployment.findUnique({
            where: { id: deploymentId },
            include: { workflow: { include: { seller: true } } },
        });
        if (!deployment) {
            throw new common_1.NotFoundException('Deployment not found');
        }
        if (deployment.userId !== userId) {
            throw new common_1.ForbiddenException('You do not own this deployment');
        }
        return this.mapDeployment(deployment);
    }
    async createDeployment(userId, dto) {
        const workflow = await this.prisma.workflow.findUnique({
            where: { id: dto.workflowId },
        });
        if (!workflow || workflow.status !== client_1.WorkflowStatus.APPROVED) {
            throw new common_1.NotFoundException('Approved workflow not found');
        }
        const canDeployOwnWorkflow = workflow.sellerId === userId;
        if (!canDeployOwnWorkflow) {
            const purchase = await this.prisma.purchase.findFirst({
                where: { userId, workflowId: workflow.id },
                select: { id: true },
            });
            if (!purchase) {
                throw new common_1.ForbiddenException('You can only deploy workflows you purchased or own');
            }
        }
        const encrypted = dto.config
            ? this.encryptionService.encryptObject(dto.config)
            : null;
        const deployment = await this.prisma.deployment.create({
            data: {
                userId,
                workflowId: workflow.id,
                status: client_1.DeploymentStatus.CONFIGURING,
                configEncrypted: encrypted?.encrypted ?? null,
                configIv: encrypted?.iv ?? null,
                configAuthTag: encrypted?.authTag ?? null,
            },
            include: { workflow: { include: { seller: true } } },
        });
        await this.deploymentProcessor.enqueueDeployment(deployment.id);
        return this.mapDeployment(deployment);
    }
    async configureDeployment(userId, deploymentId, dto) {
        const deployment = await this.ensureOwnedDeployment(userId, deploymentId);
        const encrypted = this.encryptionService.encryptObject(dto.config);
        const updated = await this.prisma.deployment.update({
            where: { id: deployment.id },
            data: {
                status: client_1.DeploymentStatus.CONFIGURING,
                configEncrypted: encrypted.encrypted,
                configIv: encrypted.iv,
                configAuthTag: encrypted.authTag,
            },
            include: { workflow: { include: { seller: true } } },
        });
        await this.deploymentProcessor.enqueueDeployment(updated.id);
        return this.mapDeployment(updated);
    }
    async pauseDeployment(userId, deploymentId) {
        const deployment = await this.ensureOwnedDeployment(userId, deploymentId);
        if (deployment.n8nWorkflowId) {
            await this.n8nService.setWorkflowActive(deployment.n8nWorkflowId, false);
        }
        const updated = await this.prisma.deployment.update({
            where: { id: deployment.id },
            data: { status: client_1.DeploymentStatus.PAUSED },
            include: { workflow: { include: { seller: true } } },
        });
        return this.mapDeployment(updated);
    }
    async resumeDeployment(userId, deploymentId) {
        const deployment = await this.ensureOwnedDeployment(userId, deploymentId);
        await this.deploymentProcessor.enqueueDeployment(deployment.id);
        const updated = await this.prisma.deployment.update({
            where: { id: deployment.id },
            data: { status: client_1.DeploymentStatus.CONFIGURING },
            include: { workflow: { include: { seller: true } } },
        });
        return this.mapDeployment(updated);
    }
    async stopDeployment(userId, deploymentId) {
        const deployment = await this.ensureOwnedDeployment(userId, deploymentId);
        if (deployment.n8nWorkflowId) {
            await this.n8nService.setWorkflowActive(deployment.n8nWorkflowId, false);
        }
        const updated = await this.prisma.deployment.update({
            where: { id: deployment.id },
            data: { status: client_1.DeploymentStatus.STOPPED },
            include: { workflow: { include: { seller: true } } },
        });
        return this.mapDeployment(updated);
    }
    async getDeploymentLogs(userId, deploymentId, query) {
        const deployment = await this.ensureOwnedDeployment(userId, deploymentId);
        const [storedLogs, remoteLogs] = await Promise.all([
            this.prisma.executionLog.findMany({
                where: { deploymentId: deployment.id },
                orderBy: { executedAt: 'desc' },
                take: query.limit,
            }),
            deployment.n8nWorkflowId
                ? this.n8nService.fetchExecutionLogs(deployment.n8nWorkflowId, query.limit)
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
        const deduped = new Map([...mappedRemote, ...mappedStored].map((item) => [item.id, item]));
        return Array.from(deduped.values())
            .sort((a, b) => b.executedAt.getTime() - a.executedAt.getTime())
            .slice(0, query.limit);
    }
    async ensureOwnedDeployment(userId, deploymentId) {
        const deployment = await this.prisma.deployment.findUnique({
            where: { id: deploymentId },
            include: { workflow: { include: { seller: true } } },
        });
        if (!deployment) {
            throw new common_1.NotFoundException('Deployment not found');
        }
        if (deployment.userId !== userId) {
            throw new common_1.ForbiddenException('You do not own this deployment');
        }
        return deployment;
    }
    mapDeployment(deployment) {
        const config = deployment.configEncrypted &&
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
            workflow: (0, workflow_mapper_1.mapWorkflow)(deployment.workflow),
            createdAt: deployment.createdAt,
            updatedAt: deployment.updatedAt,
        };
    }
};
exports.DeploymentsService = DeploymentsService;
exports.DeploymentsService = DeploymentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        encryption_service_1.EncryptionService,
        deployment_processor_1.DeploymentProcessor,
        n8n_service_1.N8nService])
], DeploymentsService);
//# sourceMappingURL=deployments.service.js.map