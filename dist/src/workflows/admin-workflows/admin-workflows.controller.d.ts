import type { Request } from 'express';
import { AdminQueryWorkflowsDto } from '../dto/admin-query-workflows.dto';
import { FeatureWorkflowDto } from '../dto/feature-workflow.dto';
import { ModerateWorkflowDto } from '../dto/moderate-workflow.dto';
import { WorkflowsService } from '../workflows.service';
export declare class AdminWorkflowsController {
    private readonly workflowsService;
    constructor(workflowsService: WorkflowsService);
    getAdminWorkflows(req: Request, query: AdminQueryWorkflowsDto): Promise<import("../../common/pagination/paginated-response").PaginatedResponse<import("../workflow.mapper").WorkflowResponse>>;
    moderateWorkflow(req: Request, id: string, dto: ModerateWorkflowDto): Promise<import("../workflow.mapper").WorkflowResponse>;
    featureWorkflow(req: Request, id: string, dto: FeatureWorkflowDto): Promise<import("../workflow.mapper").WorkflowResponse>;
}
