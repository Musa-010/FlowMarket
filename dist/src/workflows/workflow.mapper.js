"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapWorkflow = mapWorkflow;
function toStringArray(value) {
    if (!Array.isArray(value)) {
        return [];
    }
    return value.filter((item) => typeof item === 'string');
}
function mapWorkflow(workflow) {
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
//# sourceMappingURL=workflow.mapper.js.map