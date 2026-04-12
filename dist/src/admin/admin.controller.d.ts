import { AdminService } from './admin.service';
export declare class AdminController {
    private readonly adminService;
    constructor(adminService: AdminService);
    analytics(): Promise<{
        revenue: number;
        totalUsers: number;
        totalWorkflows: number;
        totalPurchases: number;
        activeSubscriptions: number;
    }>;
    sellerEarnings(sellerId: string): Promise<{
        workflowId: string;
        totalEarned: number;
    }[]>;
}
