import { PayoutsService } from './payouts.service';
export declare class PayoutsController {
    private readonly payoutsService;
    constructor(payoutsService: PayoutsService);
    listForSeller(sellerId: string): Promise<{
        total: number;
        items: {
            id: string;
            createdAt: Date;
            status: string;
            sellerId: string;
            amount: number;
            reference: string | null;
        }[];
    }>;
    createForSeller(sellerId: string, body: any): Promise<{
        id: string;
        createdAt: Date;
        status: string;
        sellerId: string;
        amount: number;
        reference: string | null;
    }>;
    get(id: string): Promise<{
        id: string;
        createdAt: Date;
        status: string;
        sellerId: string;
        amount: number;
        reference: string | null;
    } | null>;
}
