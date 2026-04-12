import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, WorkflowStatus } from '@prisma/client';
import { buildPaginatedResponse } from '../common/pagination/paginated-response';
import { EmailService } from '../email/email.service';
import { PrismaService } from '../prisma/prisma.service';
import { mapWorkflow } from '../workflows/workflow.mapper';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { QueryPurchasesDto } from './dto/query-purchases.dto';

@Injectable()
export class PurchasesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  async getPurchases(userId: string, query: QueryPurchasesDto) {
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

    return buildPaginatedResponse(
      purchases.map((purchase) => this.mapPurchase(purchase)),
      total,
      query.page,
      query.limit,
    );
  }

  async createPurchase(userId: string, dto: CreatePurchaseDto) {
    const workflow = await this.prisma.workflow.findFirst({
      where: {
        id: dto.workflowId,
        status: WorkflowStatus.APPROVED,
      },
    });
    if (!workflow) {
      throw new NotFoundException('Approved workflow not found');
    }

    const resolvedPrice =
      dto.pricePaid ?? workflow.oneTimePrice ?? workflow.monthlyPrice ?? 0;

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

  private mapPurchase(
    purchase: Prisma.PurchaseGetPayload<{
      include: { workflow: { include: { seller: true } } };
    }>,
  ) {
    return {
      id: purchase.id,
      userId: purchase.userId,
      workflowId: purchase.workflowId,
      pricePaid: purchase.pricePaid,
      stripePaymentId: purchase.stripePaymentId,
      workflow: mapWorkflow(purchase.workflow),
      createdAt: purchase.createdAt,
    };
  }
}
