import type { Request } from 'express';
import { CreateReviewDto } from './dto/create-review.dto';
import { QueryReviewsDto } from './dto/query-reviews.dto';
import { ReviewsService } from './reviews.service';
export declare class ReviewsController {
    private readonly reviewsService;
    constructor(reviewsService: ReviewsService);
    getWorkflowReviews(workflowId: string, query: QueryReviewsDto): Promise<import("../common/pagination/paginated-response").PaginatedResponse<{
        id: string;
        userId: string;
        workflowId: string;
        rating: number;
        comment: string | null;
        userName: string;
        userAvatarUrl: null;
        createdAt: Date;
    }>>;
    createOrUpdateReview(req: Request, workflowId: string, dto: CreateReviewDto): Promise<{
        id: string;
        userId: string;
        workflowId: string;
        rating: number;
        comment: string | null;
        userName: string;
        userAvatarUrl: null;
        createdAt: Date;
    }>;
}
