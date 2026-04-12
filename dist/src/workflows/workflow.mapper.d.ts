import { Prisma } from '@prisma/client';
type WorkflowWithSeller = Prisma.WorkflowGetPayload<{
    include: {
        seller: true;
    };
}>;
export interface WorkflowResponse {
    id: string;
    title: string;
    slug: string;
    shortDescription: string;
    fullDescription: string | null;
    platform: string;
    category: string;
    difficulty: string;
    oneTimePrice: number | null;
    monthlyPrice: number | null;
    previewImages: string[];
    requiredIntegrations: string[];
    tags: string[];
    steps: string[];
    demoVideoUrl: string | null;
    workflowFileUrl: string | null;
    avgRating: number;
    reviewCount: number;
    purchaseCount: number;
    setupTime: string | null;
    status: string;
    sellerId: string | null;
    sellerName: string | null;
    sellerAvatarUrl: string | null;
    isFeatured: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare function mapWorkflow(workflow: WorkflowWithSeller): WorkflowResponse;
export {};
