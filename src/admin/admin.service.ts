import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async analyticsOverview() {
    const [revenue, totalUsers, totalWorkflows, totalPurchases, activeSubscriptions] = await this.prisma.$transaction([
      this.prisma.purchase.aggregate({ _sum: { pricePaid: true } }),
      this.prisma.user.count(),
      this.prisma.workflow.count(),
      this.prisma.purchase.count(),
      this.prisma.subscription.count({ where: { status: 'ACTIVE' } }),
    ]);

    return {
      revenue: revenue._sum.pricePaid ?? 0,
      totalUsers,
      totalWorkflows,
      totalPurchases,
      activeSubscriptions,
    };
  }

  async sellerEarningsReport(sellerId: string) {
    const earnings = await this.prisma.purchase.groupBy({
      by: ['workflowId'],
      where: { workflow: { sellerId } },
      _sum: { pricePaid: true },
    });
    return earnings.map((r) => ({ workflowId: r.workflowId, totalEarned: r._sum.pricePaid ?? 0 }));
  }
}
