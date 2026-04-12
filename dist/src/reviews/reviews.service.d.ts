import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { QueryReviewsDto } from './dto/query-reviews.dto';
export declare class ReviewsService {
    private readonly prisma;
    private readonly notificationsService;
    constructor(prisma: PrismaService, notificationsService: NotificationsService);
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
    upsertWorkflowReview(userId: string, workflowId: string, dto: CreateReviewDto): Promise<{
        id: string;
        userId: string;
        workflowId: string;
        rating: number;
        comment: string | null;
        userName: string;
        userAvatarUrl: null;
        createdAt: Date;
    }>;
    private mapReview;
}
