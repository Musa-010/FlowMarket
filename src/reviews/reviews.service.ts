import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { NotificationType, Prisma } from '@prisma/client';
import { buildPaginatedResponse } from '../common/pagination/paginated-response';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { QueryReviewsDto } from './dto/query-reviews.dto';

@Injectable()
export class ReviewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async getWorkflowReviews(workflowId: string, query: QueryReviewsDto) {
    const workflow = await this.prisma.workflow.findUnique({
      where: { id: workflowId },
      select: { id: true },
    });
    if (!workflow) {
      throw new NotFoundException('Workflow not found');
    }

    const [total, reviews] = await this.prisma.$transaction([
      this.prisma.review.count({ where: { workflowId } }),
      this.prisma.review.findMany({
        where: { workflowId },
        include: { user: true },
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
    ]);

    return buildPaginatedResponse(
      reviews.map((review) => this.mapReview(review)),
      total,
      query.page,
      query.limit,
    );
  }

  async upsertWorkflowReview(
    userId: string,
    workflowId: string,
    dto: CreateReviewDto,
  ) {
    const workflow = await this.prisma.workflow.findUnique({
      where: { id: workflowId },
      select: { id: true, title: true, sellerId: true },
    });
    if (!workflow) {
      throw new NotFoundException('Workflow not found');
    }

    const purchase = await this.prisma.purchase.findFirst({
      where: { userId, workflowId },
      select: { id: true },
    });
    if (!purchase) {
      throw new ForbiddenException(
        'Only buyers who purchased this workflow can submit a review',
      );
    }

    const review = await this.prisma.review.upsert({
      where: { userId_workflowId: { userId, workflowId } },
      create: {
        userId,
        workflowId,
        rating: dto.rating,
        comment: dto.comment?.trim() || null,
      },
      update: {
        rating: dto.rating,
        comment: dto.comment?.trim() || null,
      },
      include: { user: true },
    });

    const aggregate = await this.prisma.review.aggregate({
      where: { workflowId },
      _avg: { rating: true },
      _count: { _all: true },
    });

    await this.prisma.workflow.update({
      where: { id: workflowId },
      data: {
        avgRating: aggregate._avg.rating ?? 0,
        reviewCount: aggregate._count._all,
      },
    });

    if (workflow.sellerId && workflow.sellerId !== userId) {
      await this.notificationsService.createNotification(
        workflow.sellerId,
        {
          title: 'New Review',
          body: `A buyer left a ${dto.rating}-star review on ${workflow.title}.`,
          type: NotificationType.REVIEW,
          data: { workflowId, rating: dto.rating },
        },
        true,
      );
    }

    return this.mapReview(review);
  }

  private mapReview(
    review: Prisma.ReviewGetPayload<{
      include: { user: true };
    }>,
  ) {
    return {
      id: review.id,
      userId: review.userId,
      workflowId: review.workflowId,
      rating: review.rating,
      comment: review.comment,
      userName: review.user.name,
      userAvatarUrl: null,
      createdAt: review.createdAt,
    };
  }
}
