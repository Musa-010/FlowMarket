import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { AdminQueryWorkflowsDto } from './dto/admin-query-workflows.dto';
import { CreateWorkflowDto } from './dto/create-workflow.dto';
import { FeatureWorkflowDto } from './dto/feature-workflow.dto';
import { ModerateWorkflowDto } from './dto/moderate-workflow.dto';
import { QueryWorkflowsDto } from './dto/query-workflows.dto';
import { UpdateWorkflowDto } from './dto/update-workflow.dto';
import { WorkflowResponse } from './workflow.mapper';
export declare class WorkflowsService {
    private readonly prisma;
    private readonly emailService;
    constructor(prisma: PrismaService, emailService: EmailService);
    getPublicWorkflows(query: QueryWorkflowsDto): Promise<import("../common/pagination/paginated-response").PaginatedResponse<WorkflowResponse>>;
    getFeaturedWorkflows(limit?: number): Promise<WorkflowResponse[]>;
    getWorkflowBySlug(slug: string): Promise<WorkflowResponse>;
    getSellerWorkflows(sellerId: string): Promise<WorkflowResponse[]>;
    createSellerWorkflow(sellerId: string, dto: CreateWorkflowDto): Promise<WorkflowResponse>;
    updateSellerWorkflow(sellerId: string, workflowId: string, dto: UpdateWorkflowDto): Promise<WorkflowResponse>;
    submitSellerWorkflow(sellerId: string, workflowId: string): Promise<WorkflowResponse>;
    getAdminWorkflows(query: AdminQueryWorkflowsDto): Promise<import("../common/pagination/paginated-response").PaginatedResponse<WorkflowResponse>>;
    moderateWorkflow(workflowId: string, dto: ModerateWorkflowDto): Promise<WorkflowResponse>;
    featureWorkflow(workflowId: string, dto: FeatureWorkflowDto): Promise<WorkflowResponse>;
    private buildWhereFilter;
    private buildOrderBy;
    private generateUniqueSlug;
}
