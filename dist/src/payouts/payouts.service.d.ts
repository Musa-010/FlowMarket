import { PrismaService } from '../prisma/prisma.service';
export declare class PayoutsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    listPayoutsForSeller(sellerId: string, { skip, take }?: {
        skip?: number | undefined;
        take?: number | undefined;
    }): Promise<{
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
    createPayout(sellerId: string, amount: number, reference?: string): Promise<{
        id: string;
        createdAt: Date;
        status: string;
        sellerId: string;
        amount: number;
        reference: string | null;
    }>;
    getPayout(id: string): Promise<{
        id: string;
        createdAt: Date;
        status: string;
        sellerId: string;
        amount: number;
        reference: string | null;
    } | null>;
}
