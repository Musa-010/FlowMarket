import { QueryWorkflowsDto } from '../dto/query-workflows.dto';
import { WorkflowsService } from '../workflows.service';
export declare class WorkflowsPublicController {
    private readonly workflowsService;
    constructor(workflowsService: WorkflowsService);
    getPublicWorkflows(query: QueryWorkflowsDto): Promise<import("../../common/pagination/paginated-response").PaginatedResponse<import("../workflow.mapper").WorkflowResponse>>;
    getFeaturedWorkflows(): Promise<import("../workflow.mapper").WorkflowResponse[]>;
    getWorkflowBySlug(slug: string): Promise<import("../workflow.mapper").WorkflowResponse>;
}
