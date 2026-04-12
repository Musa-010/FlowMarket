import type { Request } from 'express';
import { CreateWorkflowDto } from '../dto/create-workflow.dto';
import { UpdateWorkflowDto } from '../dto/update-workflow.dto';
import { WorkflowsService } from '../workflows.service';
export declare class SellerWorkflowsController {
    private readonly workflowsService;
    constructor(workflowsService: WorkflowsService);
    getSellerWorkflows(req: Request): Promise<{
        data: import("../workflow.mapper").WorkflowResponse[];
    }>;
    createSellerWorkflow(req: Request, dto: CreateWorkflowDto): Promise<import("../workflow.mapper").WorkflowResponse>;
    updateSellerWorkflow(req: Request, id: string, dto: UpdateWorkflowDto): Promise<import("../workflow.mapper").WorkflowResponse>;
    submitSellerWorkflow(req: Request, id: string): Promise<import("../workflow.mapper").WorkflowResponse>;
}
