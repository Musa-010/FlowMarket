import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, WorkflowDifficulty, WorkflowStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { buildPaginatedResponse } from '../common/pagination/paginated-response';
import { EmailService } from '../email/email.service';
import { AdminQueryWorkflowsDto } from './dto/admin-query-workflows.dto';
import { CreateWorkflowDto } from './dto/create-workflow.dto';
import { FeatureWorkflowDto } from './dto/feature-workflow.dto';
import { ModerateWorkflowDto } from './dto/moderate-workflow.dto';
import { QueryWorkflowsDto } from './dto/query-workflows.dto';
import { UpdateWorkflowDto } from './dto/update-workflow.dto';
import { mapWorkflow, WorkflowResponse } from './workflow.mapper';

@Injectable()
export class WorkflowsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  async getPublicWorkflows(query: QueryWorkflowsDto) {
    const where = this.buildWhereFilter(query, {
      enforceApproved: true,
    });
    const orderBy = this.buildOrderBy(query.sort);

    const [total, workflows] = await this.prisma.$transaction([
      this.prisma.workflow.count({ where }),
      this.prisma.workflow.findMany({
        where,
        include: { seller: true },
        orderBy,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
    ]);

    return buildPaginatedResponse(
      workflows.map(mapWorkflow),
      total,
      query.page,
      query.limit,
    );
  }

  async getFeaturedWorkflows(limit = 6): Promise<WorkflowResponse[]> {
    const workflows = await this.prisma.workflow.findMany({
      where: {
        status: WorkflowStatus.APPROVED,
        isFeatured: true,
      },
      include: { seller: true },
      orderBy: [{ avgRating: 'desc' }, { purchaseCount: 'desc' }],
      take: limit,
    });

    return workflows.map(mapWorkflow);
  }

  async getWorkflowBySlug(slug: string): Promise<WorkflowResponse> {
    const workflow = await this.prisma.workflow.findFirst({
      where: {
        slug,
        status: WorkflowStatus.APPROVED,
      },
      include: { seller: true },
    });

    if (!workflow) {
      throw new NotFoundException('Workflow not found');
    }

    return mapWorkflow(workflow);
  }

  async getSellerWorkflows(sellerId: string): Promise<WorkflowResponse[]> {
    const workflows = await this.prisma.workflow.findMany({
      where: { sellerId },
      include: { seller: true },
      orderBy: { updatedAt: 'desc' },
    });

    return workflows.map(mapWorkflow);
  }

  async createSellerWorkflow(
    sellerId: string,
    dto: CreateWorkflowDto,
  ): Promise<WorkflowResponse> {
    const slug = await this.generateUniqueSlug(dto.title);

    const workflow = await this.prisma.workflow.create({
      data: {
        title: dto.title,
        slug,
        shortDescription: dto.shortDescription,
        fullDescription: dto.fullDescription ?? null,
        platform: dto.platform,
        category: dto.category,
        difficulty: dto.difficulty ?? WorkflowDifficulty.BEGINNER,
        oneTimePrice: dto.oneTimePrice ?? null,
        monthlyPrice: dto.monthlyPrice ?? null,
        previewImages: dto.previewImages ?? [],
        requiredIntegrations: dto.requiredIntegrations ?? [],
        tags: dto.tags ?? [],
        steps: dto.steps ?? [],
        demoVideoUrl: dto.demoVideoUrl ?? null,
        workflowFileUrl: dto.workflowFileUrl ?? null,
        setupTime: dto.setupTime ?? null,
        status: WorkflowStatus.DRAFT,
        sellerId,
      },
      include: { seller: true },
    });

    return mapWorkflow(workflow);
  }

  async updateSellerWorkflow(
    sellerId: string,
    workflowId: string,
    dto: UpdateWorkflowDto,
  ): Promise<WorkflowResponse> {
    const existing = await this.prisma.workflow.findUnique({
      where: { id: workflowId },
      include: { seller: true },
    });

    if (!existing) {
      throw new NotFoundException('Workflow not found');
    }
    if (existing.sellerId !== sellerId) {
      throw new ForbiddenException('You do not own this workflow');
    }

    const data: Prisma.WorkflowUpdateInput = {};
    if (dto.title !== undefined) {
      data.title = dto.title;
      data.slug = await this.generateUniqueSlug(dto.title, existing.id);
    }
    if (dto.shortDescription !== undefined) {
      data.shortDescription = dto.shortDescription;
    }
    if (dto.fullDescription !== undefined) {
      data.fullDescription = dto.fullDescription ?? null;
    }
    if (dto.platform !== undefined) {
      data.platform = dto.platform;
    }
    if (dto.category !== undefined) {
      data.category = dto.category;
    }
    if (dto.difficulty !== undefined) {
      data.difficulty = dto.difficulty;
    }
    if (dto.oneTimePrice !== undefined) {
      data.oneTimePrice = dto.oneTimePrice;
    }
    if (dto.monthlyPrice !== undefined) {
      data.monthlyPrice = dto.monthlyPrice;
    }
    if (dto.previewImages !== undefined) {
      data.previewImages = dto.previewImages;
    }
    if (dto.requiredIntegrations !== undefined) {
      data.requiredIntegrations = dto.requiredIntegrations;
    }
    if (dto.tags !== undefined) {
      data.tags = dto.tags;
    }
    if (dto.steps !== undefined) {
      data.steps = dto.steps;
    }
    if (dto.demoVideoUrl !== undefined) {
      data.demoVideoUrl = dto.demoVideoUrl;
    }
    if (dto.workflowFileUrl !== undefined) {
      data.workflowFileUrl = dto.workflowFileUrl;
    }
    if (dto.setupTime !== undefined) {
      data.setupTime = dto.setupTime;
    }

    if (existing.status === WorkflowStatus.REJECTED) {
      data.status = WorkflowStatus.DRAFT;
      data.rejectionReason = null;
    }

    const updated = await this.prisma.workflow.update({
      where: { id: workflowId },
      data,
      include: { seller: true },
    });

    return mapWorkflow(updated);
  }

  async submitSellerWorkflow(
    sellerId: string,
    workflowId: string,
  ): Promise<WorkflowResponse> {
    const existing = await this.prisma.workflow.findUnique({
      where: { id: workflowId },
    });

    if (!existing) {
      throw new NotFoundException('Workflow not found');
    }
    if (existing.sellerId !== sellerId) {
      throw new ForbiddenException('You do not own this workflow');
    }
    if (existing.status === WorkflowStatus.PENDING_REVIEW) {
      throw new BadRequestException('Workflow is already pending review');
    }

    const updated = await this.prisma.workflow.update({
      where: { id: workflowId },
      data: {
        status: WorkflowStatus.PENDING_REVIEW,
        rejectionReason: null,
      },
      include: { seller: true },
    });

    if (updated.sellerId) {
      if (updated.status === WorkflowStatus.APPROVED) {
        await this.emailService.sendSellerWorkflowApprovedEmail({
          sellerId: updated.sellerId,
          workflowTitle: updated.title,
        });
      }

      if (updated.status === WorkflowStatus.REJECTED) {
        await this.emailService.sendSellerWorkflowRejectedEmail({
          sellerId: updated.sellerId,
          workflowTitle: updated.title,
          rejectionReason:
            updated.rejectionReason ?? 'No rejection reason was provided.',
        });
      }
    }

    return mapWorkflow(updated);
  }

  async getAdminWorkflows(query: AdminQueryWorkflowsDto) {
    const where = this.buildWhereFilter(query, {
      enforceApproved: false,
      explicitStatus: query.status,
    });
    const orderBy = this.buildOrderBy(query.sort);

    const [total, workflows] = await this.prisma.$transaction([
      this.prisma.workflow.count({ where }),
      this.prisma.workflow.findMany({
        where,
        include: { seller: true },
        orderBy,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
    ]);

    return buildPaginatedResponse(
      workflows.map(mapWorkflow),
      total,
      query.page,
      query.limit,
    );
  }

  async moderateWorkflow(
    workflowId: string,
    dto: ModerateWorkflowDto,
  ): Promise<WorkflowResponse> {
    if (
      dto.status === WorkflowStatus.REJECTED &&
      (!dto.rejectionReason || !dto.rejectionReason.trim())
    ) {
      throw new BadRequestException(
        'rejectionReason is required when rejecting a workflow',
      );
    }

    const workflow = await this.prisma.workflow.findUnique({
      where: { id: workflowId },
    });
    if (!workflow) {
      throw new NotFoundException('Workflow not found');
    }

    const updated = await this.prisma.workflow.update({
      where: { id: workflowId },
      data: {
        status: dto.status,
        rejectionReason:
          dto.status === WorkflowStatus.REJECTED
            ? (dto.rejectionReason?.trim() ?? null)
            : null,
      },
      include: { seller: true },
    });

    return mapWorkflow(updated);
  }

  async featureWorkflow(
    workflowId: string,
    dto: FeatureWorkflowDto,
  ): Promise<WorkflowResponse> {
    const workflow = await this.prisma.workflow.findUnique({
      where: { id: workflowId },
    });
    if (!workflow) {
      throw new NotFoundException('Workflow not found');
    }

    const updated = await this.prisma.workflow.update({
      where: { id: workflowId },
      data: {
        isFeatured: dto.isFeatured,
      },
      include: { seller: true },
    });

    return mapWorkflow(updated);
  }

  private buildWhereFilter(
    query: QueryWorkflowsDto | AdminQueryWorkflowsDto,
    options: { enforceApproved: boolean; explicitStatus?: WorkflowStatus },
  ): Prisma.WorkflowWhereInput {
    const where: Prisma.WorkflowWhereInput = {};

    if (options.explicitStatus) {
      where.status = options.explicitStatus;
    } else if (options.enforceApproved) {
      where.status = WorkflowStatus.APPROVED;
    }

    if (query.search) {
      where.OR = [
        { title: { contains: query.search } },
        { shortDescription: { contains: query.search } },
        { fullDescription: { contains: query.search } },
      ];
    }
    if (query.category) {
      where.category = query.category;
    }
    if (query.platform) {
      where.platform = query.platform;
    }
    if (query.minRating !== undefined) {
      where.avgRating = { gte: query.minRating };
    }
    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      where.oneTimePrice = {
        gte: query.minPrice,
        lte: query.maxPrice,
      };
    }

    return where;
  }

  private buildOrderBy(
    sort: QueryWorkflowsDto['sort'],
  ): Prisma.WorkflowOrderByWithRelationInput[] {
    switch (sort) {
      case 'price_asc':
        return [{ oneTimePrice: 'asc' }, { createdAt: 'desc' }];
      case 'price_desc':
        return [{ oneTimePrice: 'desc' }, { createdAt: 'desc' }];
      case 'rating_desc':
        return [{ avgRating: 'desc' }, { reviewCount: 'desc' }];
      case 'popular_desc':
        return [{ purchaseCount: 'desc' }, { createdAt: 'desc' }];
      case 'newest':
      default:
        return [{ createdAt: 'desc' }];
    }
  }

  private async generateUniqueSlug(
    title: string,
    excludeId?: string,
  ): Promise<string> {
    const baseSlug = title
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const normalizedBaseSlug = baseSlug || 'workflow';
    let slug = normalizedBaseSlug;
    let suffix = 1;

    while (true) {
      const existing = await this.prisma.workflow.findUnique({
        where: { slug },
        select: { id: true },
      });

      if (!existing || existing.id === excludeId) {
        return slug;
      }

      slug = `${normalizedBaseSlug}-${suffix}`;
      suffix += 1;
    }
  }
}
