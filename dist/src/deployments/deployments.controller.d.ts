import type { Request } from 'express';
import { ConfigureDeploymentDto } from './dto/configure-deployment.dto';
import { CreateDeploymentDto } from './dto/create-deployment.dto';
import { QueryDeploymentLogsDto } from './dto/query-deployment-logs.dto';
import { DeploymentsService } from './deployments.service';
export declare class DeploymentsController {
    private readonly deploymentsService;
    constructor(deploymentsService: DeploymentsService);
    getDeployments(req: Request): Promise<{
        id: string;
        userId: string;
        workflowId: string;
        status: import("@prisma/client").$Enums.DeploymentStatus;
        n8nWorkflowId: string | null;
        config: Record<string, unknown>;
        totalExecutions: number;
        lastRunAt: Date | null;
        workflow: import("../workflows/workflow.mapper").WorkflowResponse;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    getDeploymentById(req: Request, id: string): Promise<{
        id: string;
        userId: string;
        workflowId: string;
        status: import("@prisma/client").$Enums.DeploymentStatus;
        n8nWorkflowId: string | null;
        config: Record<string, unknown>;
        totalExecutions: number;
        lastRunAt: Date | null;
        workflow: import("../workflows/workflow.mapper").WorkflowResponse;
        createdAt: Date;
        updatedAt: Date;
    }>;
    createDeployment(req: Request, dto: CreateDeploymentDto): Promise<{
        id: string;
        userId: string;
        workflowId: string;
        status: import("@prisma/client").$Enums.DeploymentStatus;
        n8nWorkflowId: string | null;
        config: Record<string, unknown>;
        totalExecutions: number;
        lastRunAt: Date | null;
        workflow: import("../workflows/workflow.mapper").WorkflowResponse;
        createdAt: Date;
        updatedAt: Date;
    }>;
    configureDeployment(req: Request, id: string, dto: ConfigureDeploymentDto): Promise<{
        id: string;
        userId: string;
        workflowId: string;
        status: import("@prisma/client").$Enums.DeploymentStatus;
        n8nWorkflowId: string | null;
        config: Record<string, unknown>;
        totalExecutions: number;
        lastRunAt: Date | null;
        workflow: import("../workflows/workflow.mapper").WorkflowResponse;
        createdAt: Date;
        updatedAt: Date;
    }>;
    pauseDeployment(req: Request, id: string): Promise<{
        id: string;
        userId: string;
        workflowId: string;
        status: import("@prisma/client").$Enums.DeploymentStatus;
        n8nWorkflowId: string | null;
        config: Record<string, unknown>;
        totalExecutions: number;
        lastRunAt: Date | null;
        workflow: import("../workflows/workflow.mapper").WorkflowResponse;
        createdAt: Date;
        updatedAt: Date;
    }>;
    resumeDeployment(req: Request, id: string): Promise<{
        id: string;
        userId: string;
        workflowId: string;
        status: import("@prisma/client").$Enums.DeploymentStatus;
        n8nWorkflowId: string | null;
        config: Record<string, unknown>;
        totalExecutions: number;
        lastRunAt: Date | null;
        workflow: import("../workflows/workflow.mapper").WorkflowResponse;
        createdAt: Date;
        updatedAt: Date;
    }>;
    stopDeployment(req: Request, id: string): Promise<{
        id: string;
        userId: string;
        workflowId: string;
        status: import("@prisma/client").$Enums.DeploymentStatus;
        n8nWorkflowId: string | null;
        config: Record<string, unknown>;
        totalExecutions: number;
        lastRunAt: Date | null;
        workflow: import("../workflows/workflow.mapper").WorkflowResponse;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getDeploymentLogs(req: Request, id: string, query: QueryDeploymentLogsDto): Promise<{
        id: string;
        deploymentId: string;
        success: boolean;
        durationMs: number;
        errorMessage: string | null;
        executedAt: Date;
    }[]>;
}
