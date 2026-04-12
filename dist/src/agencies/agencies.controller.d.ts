import { AgenciesService } from './agencies.service';
export declare class AgenciesController {
    private readonly agenciesService;
    constructor(agenciesService: AgenciesService);
    create(body: any): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        domain: string | null;
        ownerId: string;
        brandLogoUrl: string | null;
    }>;
    get(id: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        domain: string | null;
        ownerId: string;
        brandLogoUrl: string | null;
    } | null>;
    list(skip?: string, take?: string): Promise<{
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
    update(id: string, body: any): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        domain: string | null;
        ownerId: string;
        brandLogoUrl: string | null;
    }>;
    delete(id: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        domain: string | null;
        ownerId: string;
        brandLogoUrl: string | null;
    }>;
}
