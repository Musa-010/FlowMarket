import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PayoutsService {
  constructor(private readonly prisma: PrismaService) {}

  async listPayoutsForSeller(sellerId: string, { skip = 0, take = 20 } = {}) {
    const [total, items] = await this.prisma.$transaction([
      this.prisma.payout.count({ where: { sellerId } }),
      this.prisma.payout.findMany({ where: { sellerId }, skip, take, orderBy: { createdAt: 'desc' } }),
    ]);
    return { total, items };
  }

  async createPayout(sellerId: string, amount: number, reference?: string) {
    if (amount <= 0) throw new BadRequestException('amount must be > 0');
    return this.prisma.payout.create({ data: { sellerId, amount, reference } });
  }

  async getPayout(id: string) {
    return this.prisma.payout.findUnique({ where: { id } });
  }
}
