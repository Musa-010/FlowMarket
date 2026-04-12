import { EmailService } from '../email/email.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { QueryPurchasesDto } from './dto/query-purchases.dto';
export declare class PurchasesService {
    private readonly prisma;
    private readonly emailService;
    constructor(prisma: PrismaService, emailService: EmailService);
    getPurchases(userId: string, query: QueryPurchasesDto): Promise<import("../common/pagination/paginated-response").PaginatedResponse<{
        id: string;
        userId: string;
        workflowId: string;
        pricePaid: number;
        stripePaymentId: string | null;
        workflow: import("../workflows/workflow.mapper").WorkflowResponse;
        createdAt: Date;
    }>>;
    createPurchase(userId: string, dto: CreatePurchaseDto): Promise<{
        id: string;
        userId: string;
        workflowId: string;
        pricePaid: number;
        stripePaymentId: string | null;
        workflow: import("../workflows/workflow.mapper").WorkflowResponse;
        createdAt: Date;
    }>;
    private mapPurchase;
}
