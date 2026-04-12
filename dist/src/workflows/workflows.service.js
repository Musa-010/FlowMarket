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
exports.WorkflowsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const paginated_response_1 = require("../common/pagination/paginated-response");
const email_service_1 = require("../email/email.service");
const workflow_mapper_1 = require("./workflow.mapper");
let WorkflowsService = class WorkflowsService {
    prisma;
    emailService;
    constructor(prisma, emailService) {
        this.prisma = prisma;
        this.emailService = emailService;
    }
    async getPublicWorkflows(query) {
        const where = this.buildWhereFilter(query, {
            enforceApproved: true,
        });
        const orderBy = this.buildOrderBy(query.sort);
        const [total, workflows] = await this.prisma.$transaction([
            this.prisma.workflow.count({ where }),
            this.prisma.workflow.findMany({
                where,
                include: { seller: true },
                orderBy,
                skip: (query.page - 1) * query.limit,
                take: query.limit,
            }),
        ]);
        return (0, paginated_response_1.buildPaginatedResponse)(workflows.map(workflow_mapper_1.mapWorkflow), total, query.page, query.limit);
    }
    async getFeaturedWorkflows(limit = 6) {
        const workflows = await this.prisma.workflow.findMany({
            where: {
                status: client_1.WorkflowStatus.APPROVED,
                isFeatured: true,
            },
            include: { seller: true },
            orderBy: [{ avgRating: 'desc' }, { purchaseCount: 'desc' }],
            take: limit,
        });
        return workflows.map(workflow_mapper_1.mapWorkflow);
    }
    async getWorkflowBySlug(slug) {
        const workflow = await this.prisma.workflow.findFirst({
            where: {
                slug,
                status: client_1.WorkflowStatus.APPROVED,
            },
            include: { seller: true },
        });
        if (!workflow) {
            throw new common_1.NotFoundException('Workflow not found');
        }
        return (0, workflow_mapper_1.mapWorkflow)(workflow);
    }
    async getSellerWorkflows(sellerId) {
        const workflows = await this.prisma.workflow.findMany({
            where: { sellerId },
            include: { seller: true },
            orderBy: { updatedAt: 'desc' },
        });
        return workflows.map(workflow_mapper_1.mapWorkflow);
    }
    async createSellerWorkflow(sellerId, dto) {
        const slug = await this.generateUniqueSlug(dto.title);
        const workflow = await this.prisma.workflow.create({
            data: {
                title: dto.title,
                slug,
                shortDescription: dto.shortDescription,
                fullDescription: dto.fullDescription ?? null,
                platform: dto.platform,
                category: dto.category,
                difficulty: dto.difficulty ?? client_1.WorkflowDifficulty.BEGINNER,
                oneTimePrice: dto.oneTimePrice ?? null,
                monthlyPrice: dto.monthlyPrice ?? null,
                previewImages: dto.previewImages ?? [],
                requiredIntegrations: dto.requiredIntegrations ?? [],
                tags: dto.tags ?? [],
                steps: dto.steps ?? [],
                demoVideoUrl: dto.demoVideoUrl ?? null,
                workflowFileUrl: dto.workflowFileUrl ?? null,
                setupTime: dto.setupTime ?? null,
                status: client_1.WorkflowStatus.DRAFT,
                sellerId,
            },
            include: { seller: true },
        });
        return (0, workflow_mapper_1.mapWorkflow)(workflow);
    }
    async updateSellerWorkflow(sellerId, workflowId, dto) {
        const existing = await this.prisma.workflow.findUnique({
            where: { id: workflowId },
            include: { seller: true },
        });
        if (!existing) {
            throw new common_1.NotFoundException('Workflow not found');
        }
        if (existing.sellerId !== sellerId) {
            throw new common_1.ForbiddenException('You do not own this workflow');
        }
        const data = {};
        if (dto.title !== undefined) {
            data.title = dto.title;
            data.slug = await this.generateUniqueSlug(dto.title, existing.id);
        }
        if (dto.shortDescription !== undefined) {
            data.shortDescription = dto.shortDescription;
        }
        if (dto.fullDescription !== undefined) {
            data.fullDescription = dto.fullDescription ?? null;
        }
        if (dto.platform !== undefined) {
            data.platform = dto.platform;
        }
        if (dto.category !== undefined) {
            data.category = dto.category;
        }
        if (dto.difficulty !== undefined) {
            data.difficulty = dto.difficulty;
        }
        if (dto.oneTimePrice !== undefined) {
            data.oneTimePrice = dto.oneTimePrice;
        }
        if (dto.monthlyPrice !== undefined) {
            data.monthlyPrice = dto.monthlyPrice;
        }
        if (dto.previewImages !== undefined) {
            data.previewImages = dto.previewImages;
        }
        if (dto.requiredIntegrations !== undefined) {
            data.requiredIntegrations = dto.requiredIntegrations;
        }
        if (dto.tags !== undefined) {
            data.tags = dto.tags;
        }
        if (dto.steps !== undefined) {
            data.steps = dto.steps;
        }
        if (dto.demoVideoUrl !== undefined) {
            data.demoVideoUrl = dto.demoVideoUrl;
        }
        if (dto.workflowFileUrl !== undefined) {
            data.workflowFileUrl = dto.workflowFileUrl;
        }
        if (dto.setupTime !== undefined) {
            data.setupTime = dto.setupTime;
        }
        if (existing.status === client_1.WorkflowStatus.REJECTED) {
            data.status = client_1.WorkflowStatus.DRAFT;
            data.rejectionReason = null;
        }
        const updated = await this.prisma.workflow.update({
            where: { id: workflowId },
            data,
            include: { seller: true },
        });
        return (0, workflow_mapper_1.mapWorkflow)(updated);
    }
    async submitSellerWorkflow(sellerId, workflowId) {
        const existing = await this.prisma.workflow.findUnique({
            where: { id: workflowId },
        });
        if (!existing) {
            throw new common_1.NotFoundException('Workflow not found');
        }
        if (existing.sellerId !== sellerId) {
            throw new common_1.ForbiddenException('You do not own this workflow');
        }
        if (existing.status === client_1.WorkflowStatus.PENDING_REVIEW) {
            throw new common_1.BadRequestException('Workflow is already pending review');
        }
        const updated = await this.prisma.workflow.update({
            where: { id: workflowId },
            data: {
                status: client_1.WorkflowStatus.PENDING_REVIEW,
                rejectionReason: null,
            },
            include: { seller: true },
        });
        if (updated.sellerId) {
            if (updated.status === client_1.WorkflowStatus.APPROVED) {
                await this.emailService.sendSellerWorkflowApprovedEmail({
                    sellerId: updated.sellerId,
                    workflowTitle: updated.title,
                });
            }
            if (updated.status === client_1.WorkflowStatus.REJECTED) {
                await this.emailService.sendSellerWorkflowRejectedEmail({
                    sellerId: updated.sellerId,
                    workflowTitle: updated.title,
                    rejectionReason: updated.rejectionReason ?? 'No rejection reason was provided.',
                });
            }
        }
        return (0, workflow_mapper_1.mapWorkflow)(updated);
    }
    async getAdminWorkflows(query) {
        const where = this.buildWhereFilter(query, {
            enforceApproved: false,
            explicitStatus: query.status,
        });
        const orderBy = this.buildOrderBy(query.sort);
        const [total, workflows] = await this.prisma.$transaction([
            this.prisma.workflow.count({ where }),
            this.prisma.workflow.findMany({
                where,
                include: { seller: true },
                orderBy,
                skip: (query.page - 1) * query.limit,
                take: query.limit,
            }),
        ]);
        return (0, paginated_response_1.buildPaginatedResponse)(workflows.map(workflow_mapper_1.mapWorkflow), total, query.page, query.limit);
    }
    async moderateWorkflow(workflowId, dto) {
        if (dto.status === client_1.WorkflowStatus.REJECTED &&
            (!dto.rejectionReason || !dto.rejectionReason.trim())) {
            throw new common_1.BadRequestException('rejectionReason is required when rejecting a workflow');
        }
        const workflow = await this.prisma.workflow.findUnique({
            where: { id: workflowId },
        });
        if (!workflow) {
            throw new common_1.NotFoundException('Workflow not found');
        }
        const updated = await this.prisma.workflow.update({
            where: { id: workflowId },
            data: {
                status: dto.status,
                rejectionReason: dto.status === client_1.WorkflowStatus.REJECTED
                    ? (dto.rejectionReason?.trim() ?? null)
                    : null,
            },
            include: { seller: true },
        });
        return (0, workflow_mapper_1.mapWorkflow)(updated);
    }
    async featureWorkflow(workflowId, dto) {
        const workflow = await this.prisma.workflow.findUnique({
            where: { id: workflowId },
        });
        if (!workflow) {
            throw new common_1.NotFoundException('Workflow not found');
        }
        const updated = await this.prisma.workflow.update({
            where: { id: workflowId },
            data: {
                isFeatured: dto.isFeatured,
            },
            include: { seller: true },
        });
        return (0, workflow_mapper_1.mapWorkflow)(updated);
    }
    buildWhereFilter(query, options) {
        const where = {};
        if (options.explicitStatus) {
            where.status = options.explicitStatus;
        }
        else if (options.enforceApproved) {
            where.status = client_1.WorkflowStatus.APPROVED;
        }
        if (query.search) {
            where.OR = [
                { title: { contains: query.search } },
                { shortDescription: { contains: query.search } },
                { fullDescription: { contains: query.search } },
            ];
        }
        if (query.category) {
            where.category = query.category;
        }
        if (query.platform) {
            where.platform = query.platform;
        }
        if (query.minRating !== undefined) {
            where.avgRating = { gte: query.minRating };
        }
        if (query.minPrice !== undefined || query.maxPrice !== undefined) {
            where.oneTimePrice = {
                gte: query.minPrice,
                lte: query.maxPrice,
            };
        }
        return where;
    }
    buildOrderBy(sort) {
        switch (sort) {
            case 'price_asc':
                return [{ oneTimePrice: 'asc' }, { createdAt: 'desc' }];
            case 'price_desc':
                return [{ oneTimePrice: 'desc' }, { createdAt: 'desc' }];
            case 'rating_desc':
                return [{ avgRating: 'desc' }, { reviewCount: 'desc' }];
            case 'popular_desc':
                return [{ purchaseCount: 'desc' }, { createdAt: 'desc' }];
            case 'newest':
            default:
                return [{ createdAt: 'desc' }];
        }
    }
    async generateUniqueSlug(title, excludeId) {
        const baseSlug = title
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
        const normalizedBaseSlug = baseSlug || 'workflow';
        let slug = normalizedBaseSlug;
        let suffix = 1;
        while (true) {
            const existing = await this.prisma.workflow.findUnique({
                where: { slug },
                select: { id: true },
            });
            if (!existing || existing.id === excludeId) {
                return slug;
            }
            slug = `${normalizedBaseSlug}-${suffix}`;
            suffix += 1;
        }
    }
};
exports.WorkflowsService = WorkflowsService;
exports.WorkflowsService = WorkflowsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        email_service_1.EmailService])
], WorkflowsService);
//# sourceMappingURL=workflows.service.js.map