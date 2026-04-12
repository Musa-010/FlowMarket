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
var DeploymentProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeploymentProcessor = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const client_1 = require("@prisma/client");
const bullmq_1 = require("bullmq");
const email_service_1 = require("../email/email.service");
const prisma_service_1 = require("../prisma/prisma.service");
const notifications_service_1 = require("../notifications/notifications.service");
const encryption_service_1 = require("./encryption/encryption.service");
const n8n_service_1 = require("./n8n/n8n.service");
let DeploymentProcessor = DeploymentProcessor_1 = class DeploymentProcessor {
    configService;
    prisma;
    n8nService;
    encryptionService;
    notificationsService;
    emailService;
    logger = new common_1.Logger(DeploymentProcessor_1.name);
    queue = null;
    worker = null;
    constructor(configService, prisma, n8nService, encryptionService, notificationsService, emailService) {
        this.configService = configService;
        this.prisma = prisma;
        this.n8nService = n8nService;
        this.encryptionService = encryptionService;
        this.notificationsService = notificationsService;
        this.emailService = emailService;
    }
    onModuleInit() {
        const connection = this.resolveRedisConnection();
        if (!connection) {
            this.logger.warn('REDIS_URL is not configured. Deployment jobs will run inline without BullMQ queue.');
            return;
        }
        this.queue = new bullmq_1.Queue('deployment-jobs', {
            connection,
        });
        this.worker = new bullmq_1.Worker('deployment-jobs', async (job) => this.handleDeploymentJob(job), {
            connection,
            concurrency: 3,
        });
        this.worker.on('failed', (job, error) => {
            this.logger.error(`Deployment job ${job?.id ?? 'unknown'} failed: ${error.message}`);
        });
    }
    async onModuleDestroy() {
        if (this.worker) {
            await this.worker.close();
            this.worker = null;
        }
        if (this.queue) {
            await this.queue.close();
            this.queue = null;
        }
    }
    async enqueueDeployment(deploymentId) {
        if (!this.queue) {
            await this.processDeploymentImmediately(deploymentId);
            return;
        }
        await this.queue.add('deploy-workflow', { deploymentId }, {
            attempts: 3,
            removeOnComplete: 200,
            removeOnFail: 500,
            backoff: {
                type: 'exponential',
                delay: 3000,
            },
        });
    }
    async processDeploymentImmediately(deploymentId) {
        await this.executeDeployment(deploymentId);
    }
    async handleDeploymentJob(job) {
        await this.executeDeployment(job.data.deploymentId);
    }
    async executeDeployment(deploymentId) {
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
            const config = deployment.configEncrypted &&
                deployment.configIv &&
                deployment.configAuthTag
                ? this.encryptionService.decryptObject({
                    encrypted: deployment.configEncrypted,
                    iv: deployment.configIv,
                    authTag: deployment.configAuthTag,
                })
                : {};
            const n8nWorkflowId = deployment.n8nWorkflowId ??
                (await this.n8nService.createWorkflowFromTemplate({
                    workflow: deployment.workflow,
                    userId: deployment.userId,
                    config,
                })).id;
            await this.n8nService.setWorkflowActive(n8nWorkflowId, true);
            const durationMs = Date.now() - start;
            await this.prisma.$transaction([
                this.prisma.deployment.update({
                    where: { id: deployment.id },
                    data: {
                        status: client_1.DeploymentStatus.ACTIVE,
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
            await this.notificationsService.createNotification(deployment.userId, {
                title: 'Deployment Active',
                body: `${deployment.workflow.title} is now running.`,
                type: 'DEPLOYMENT',
                data: {
                    deploymentId: deployment.id,
                    status: client_1.DeploymentStatus.ACTIVE,
                },
            }, true);
            await this.emailService.sendDeploymentActiveEmail({
                userId: deployment.userId,
                workflowTitle: deployment.workflow.title,
                deploymentId: deployment.id,
            });
        }
        catch (error) {
            const durationMs = Date.now() - start;
            const message = error instanceof Error ? error.message : 'Unknown deployment failure';
            await this.prisma.$transaction([
                this.prisma.deployment.update({
                    where: { id: deployment.id },
                    data: {
                        status: client_1.DeploymentStatus.FAILED,
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
            await this.notificationsService.createNotification(deployment.userId, {
                title: 'Deployment Failed',
                body: `${deployment.workflow.title} failed to deploy.`,
                type: 'DEPLOYMENT',
                data: {
                    deploymentId: deployment.id,
                    status: client_1.DeploymentStatus.FAILED,
                },
            }, true);
            await this.emailService.sendDeploymentFailedEmail({
                userId: deployment.userId,
                workflowTitle: deployment.workflow.title,
                deploymentId: deployment.id,
                failureReason: message,
            });
            throw error;
        }
    }
    resolveRedisConnection() {
        const redisUrl = this.configService.get('REDIS_URL');
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
        }
        catch (error) {
            this.logger.error(`REDIS_URL is invalid (${redisUrl}): ${error instanceof Error ? error.message : 'Unknown error'}`);
            return null;
        }
    }
};
exports.DeploymentProcessor = DeploymentProcessor;
exports.DeploymentProcessor = DeploymentProcessor = DeploymentProcessor_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        prisma_service_1.PrismaService,
        n8n_service_1.N8nService,
        encryption_service_1.EncryptionService,
        notifications_service_1.NotificationsService,
        email_service_1.EmailService])
], DeploymentProcessor);
//# sourceMappingURL=deployment.processor.js.map