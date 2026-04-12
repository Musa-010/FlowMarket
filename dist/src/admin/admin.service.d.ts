import { PrismaService } from '../prisma/prisma.service';
export declare class AdminService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    analyticsOverview(): Promise<{
        revenue: number;
        totalUsers: number;
        totalWorkflows: number;
        totalPurchases: number;
        activeSubscriptions: number;
    }>;
    sellerEarningsReport(sellerId: string): Promise<{
        workflowId: string;
        totalEarned: number;
    }[]>;
}
