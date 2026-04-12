import { WorkflowCategory, WorkflowPlatform } from '@prisma/client';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
declare const sortableValues: readonly ["newest", "price_asc", "price_desc", "rating_desc", "popular_desc"];
export declare class QueryWorkflowsDto extends PaginationQueryDto {
    search?: string;
    category?: WorkflowCategory;
    platform?: WorkflowPlatform;
    minPrice?: number;
    maxPrice?: number;
    minRating?: number;
    sort?: (typeof sortableValues)[number];
}
export {};
