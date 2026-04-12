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
exports.ReviewsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const paginated_response_1 = require("../common/pagination/paginated-response");
const notifications_service_1 = require("../notifications/notifications.service");
const prisma_service_1 = require("../prisma/prisma.service");
let ReviewsService = class ReviewsService {
    prisma;
    notificationsService;
    constructor(prisma, notificationsService) {
        this.prisma = prisma;
        this.notificationsService = notificationsService;
    }
    async getWorkflowReviews(workflowId, query) {
        const workflow = await this.prisma.workflow.findUnique({
            where: { id: workflowId },
            select: { id: true },
        });
        if (!workflow) {
            throw new common_1.NotFoundException('Workflow not found');
        }
        const [total, reviews] = await this.prisma.$transaction([
            this.prisma.review.count({ where: { workflowId } }),
            this.prisma.review.findMany({
                where: { workflowId },
                include: { user: true },
                orderBy: { createdAt: 'desc' },
                skip: (query.page - 1) * query.limit,
                take: query.limit,
            }),
        ]);
        return (0, paginated_response_1.buildPaginatedResponse)(reviews.map((review) => this.mapReview(review)), total, query.page, query.limit);
    }
    async upsertWorkflowReview(userId, workflowId, dto) {
        const workflow = await this.prisma.workflow.findUnique({
            where: { id: workflowId },
            select: { id: true, title: true, sellerId: true },
        });
        if (!workflow) {
            throw new common_1.NotFoundException('Workflow not found');
        }
        const purchase = await this.prisma.purchase.findFirst({
            where: { userId, workflowId },
            select: { id: true },
        });
        if (!purchase) {
            throw new common_1.ForbiddenException('Only buyers who purchased this workflow can submit a review');
        }
        const review = await this.prisma.review.upsert({
            where: { userId_workflowId: { userId, workflowId } },
            create: {
                userId,
                workflowId,
                rating: dto.rating,
                comment: dto.comment?.trim() || null,
            },
            update: {
                rating: dto.rating,
                comment: dto.comment?.trim() || null,
            },
            include: { user: true },
        });
        const aggregate = await this.prisma.review.aggregate({
            where: { workflowId },
            _avg: { rating: true },
            _count: { _all: true },
        });
        await this.prisma.workflow.update({
            where: { id: workflowId },
            data: {
                avgRating: aggregate._avg.rating ?? 0,
                reviewCount: aggregate._count._all,
            },
        });
        if (workflow.sellerId && workflow.sellerId !== userId) {
            await this.notificationsService.createNotification(workflow.sellerId, {
                title: 'New Review',
                body: `A buyer left a ${dto.rating}-star review on ${workflow.title}.`,
                type: client_1.NotificationType.REVIEW,
                data: { workflowId, rating: dto.rating },
            }, true);
        }
        return this.mapReview(review);
    }
    mapReview(review) {
        return {
            id: review.id,
            userId: review.userId,
            workflowId: review.workflowId,
            rating: review.rating,
            comment: review.comment,
            userName: review.user.name,
            userAvatarUrl: null,
            createdAt: review.createdAt,
        };
    }
};
exports.ReviewsService = ReviewsService;
exports.ReviewsService = ReviewsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService])
], ReviewsService);
//# sourceMappingURL=reviews.service.js.map