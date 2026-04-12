import type { Request } from 'express';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { QueryPurchasesDto } from './dto/query-purchases.dto';
import { PurchasesService } from './purchases.service';
export declare class PurchasesController {
    private readonly purchasesService;
    constructor(purchasesService: PurchasesService);
    getPurchases(req: Request, query: QueryPurchasesDto): Promise<import("../common/pagination/paginated-response").PaginatedResponse<{
        id: string;
        userId: string;
        workflowId: string;
        pricePaid: number;
        stripePaymentId: string | null;
        workflow: import("../workflows/workflow.mapper").WorkflowResponse;
        createdAt: Date;
    }>>;
    createPurchase(req: Request, dto: CreatePurchaseDto): Promise<{
        id: string;
        userId: string;
        workflowId: string;
        pricePaid: number;
        stripePaymentId: string | null;
        workflow: import("../workflows/workflow.mapper").WorkflowResponse;
        createdAt: Date;
    }>;
}
