import { Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import {
  assertRole,
  getRequestContext,
} from '../common/request/request-context';
import { CreateReviewDto } from './dto/create-review.dto';
import { QueryReviewsDto } from './dto/query-reviews.dto';
import { ReviewsService } from './reviews.service';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get('workflows/:workflowId')
  getWorkflowReviews(
    @Param('workflowId') workflowId: string,
    @Query() query: QueryReviewsDto,
  ) {
    return this.reviewsService.getWorkflowReviews(workflowId, query);
  }

  @Post('workflows/:workflowId')
  createOrUpdateReview(
    @Req() req: Request,
    @Param('workflowId') workflowId: string,
    @Body() dto: CreateReviewDto,
  ) {
    const context = getRequestContext(req);
    assertRole(context, ['BUYER', 'SELLER', 'ADMIN']);
    return this.reviewsService.upsertWorkflowReview(
      context.userId,
      workflowId,
      dto,
    );
  }
}
