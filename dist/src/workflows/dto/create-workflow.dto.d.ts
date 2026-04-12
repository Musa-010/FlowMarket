import { WorkflowCategory, WorkflowDifficulty, WorkflowPlatform } from '@prisma/client';
export declare class CreateWorkflowDto {
    title: string;
    shortDescription: string;
    fullDescription?: string;
    platform: WorkflowPlatform;
    category: WorkflowCategory;
    difficulty?: WorkflowDifficulty;
    oneTimePrice?: number;
    monthlyPrice?: number;
    previewImages?: string[];
    requiredIntegrations?: string[];
    tags?: string[];
    steps?: string[];
    demoVideoUrl?: string;
    workflowFileUrl?: string;
    setupTime?: string;
}
