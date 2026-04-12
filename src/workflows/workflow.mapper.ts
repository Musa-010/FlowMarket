import { Prisma } from '@prisma/client';

type WorkflowWithSeller = Prisma.WorkflowGetPayload<{
  include: { seller: true };
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

function toStringArray(value: Prisma.JsonValue): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item): item is string => typeof item === 'string');
}

export function mapWorkflow(workflow: WorkflowWithSeller): WorkflowResponse {
  return {
    id: workflow.id,
    title: workflow.title,
    slug: workflow.slug,
    shortDescription: workflow.shortDescription,
    fullDescription: workflow.fullDescription,
    platform: workflow.platform,
    category: workflow.category,
    difficulty: workflow.difficulty,
    oneTimePrice: workflow.oneTimePrice,
    monthlyPrice: workflow.monthlyPrice,
    previewImages: toStringArray(workflow.previewImages),
    requiredIntegrations: toStringArray(workflow.requiredIntegrations),
    tags: toStringArray(workflow.tags),
    steps: toStringArray(workflow.steps),
    demoVideoUrl: workflow.demoVideoUrl,
    workflowFileUrl: workflow.workflowFileUrl,
    avgRating: workflow.avgRating,
    reviewCount: workflow.reviewCount,
    purchaseCount: workflow.purchaseCount,
    setupTime: workflow.setupTime,
    status: workflow.status,
    sellerId: workflow.sellerId,
    sellerName: workflow.seller?.name ?? null,
    sellerAvatarUrl: null,
    isFeatured: workflow.isFeatured,
    createdAt: workflow.createdAt,
    updatedAt: workflow.updatedAt,
  };
}
