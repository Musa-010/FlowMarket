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
exports.PurchasesService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const paginated_response_1 = require("../common/pagination/paginated-response");
const email_service_1 = require("../email/email.service");
const prisma_service_1 = require("../prisma/prisma.service");
const workflow_mapper_1 = require("../workflows/workflow.mapper");
let PurchasesService = class PurchasesService {
    prisma;
    emailService;
    constructor(prisma, emailService) {
        this.prisma = prisma;
        this.emailService = emailService;
    }
    async getPurchases(userId, query) {
        const [total, purchases] = await this.prisma.$transaction([
            this.prisma.purchase.count({ where: { userId } }),
            this.prisma.purchase.findMany({
                where: { userId },
                include: { workflow: { include: { seller: true } } },
                orderBy: { createdAt: 'desc' },
                skip: (query.page - 1) * query.limit,
                take: query.limit,
            }),
        ]);
        return (0, paginated_response_1.buildPaginatedResponse)(purchases.map((purchase) => this.mapPurchase(purchase)), total, query.page, query.limit);
    }
    async createPurchase(userId, dto) {
        const workflow = await this.prisma.workflow.findFirst({
            where: {
                id: dto.workflowId,
                status: client_1.WorkflowStatus.APPROVED,
            },
        });
        if (!workflow) {
            throw new common_1.NotFoundException('Approved workflow not found');
        }
        const resolvedPrice = dto.pricePaid ?? workflow.oneTimePrice ?? workflow.monthlyPrice ?? 0;
        const [purchase] = await this.prisma.$transaction([
            this.prisma.purchase.create({
                data: {
                    userId,
                    workflowId: workflow.id,
                    pricePaid: resolvedPrice,
                    stripePaymentId: dto.stripePaymentId ?? null,
                },
                include: { workflow: { include: { seller: true } } },
            }),
            this.prisma.workflow.update({
                where: { id: workflow.id },
                data: {
                    purchaseCount: {
                        increment: 1,
                    },
                },
            }),
        ]);
        await this.emailService.sendPurchaseConfirmationEmail({
            buyerId: userId,
            workflowTitle: workflow.title,
            amountPaid: purchase.pricePaid,
            purchaseId: purchase.id,
            purchasedAt: purchase.createdAt,
        });
        if (workflow.sellerId && workflow.sellerId !== userId) {
            await this.emailService.sendPayoutProcessedEmail({
                sellerId: workflow.sellerId,
                workflowTitle: workflow.title,
                amount: purchase.pricePaid,
                payoutReference: purchase.id,
                processedAt: purchase.createdAt,
            });
        }
        return this.mapPurchase(purchase);
    }
    mapPurchase(purchase) {
        return {
            id: purchase.id,
            userId: purchase.userId,
            workflowId: purchase.workflowId,
            pricePaid: purchase.pricePaid,
            stripePaymentId: purchase.stripePaymentId,
            workflow: (0, workflow_mapper_1.mapWorkflow)(purchase.workflow),
            createdAt: purchase.createdAt,
        };
    }
};
exports.PurchasesService = PurchasesService;
exports.PurchasesService = PurchasesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        email_service_1.EmailService])
], PurchasesService);
//# sourceMappingURL=purchases.service.js.map