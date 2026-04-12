import { PrismaService } from '../prisma/prisma.service';
export declare class AgenciesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    createAgency(agencyData: any): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        domain: string | null;
        ownerId: string;
        brandLogoUrl: string | null;
    }>;
    getAgencyById(id: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        domain: string | null;
        ownerId: string;
        brandLogoUrl: string | null;
    } | null>;
    listAgencies({ skip, take }?: {
        skip?: number | undefined;
        take?: number | undefined;
    }): Promise<{
        total: number;
        items: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            domain: string | null;
            ownerId: string;
            brandLogoUrl: string | null;
        }[];
    }>;
    updateAgency(id: string, updates: any): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        domain: string | null;
        ownerId: string;
        brandLogoUrl: string | null;
    }>;
    deleteAgency(id: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        domain: string | null;
        ownerId: string;
        brandLogoUrl: string | null;
    }>;
}
