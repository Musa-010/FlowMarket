import { ConfigService } from '@nestjs/config';
import { Workflow } from '@prisma/client';
interface N8nExecutionLog {
    id: string;
    success: boolean;
    durationMs: number;
    errorMessage: string | null;
    executedAt: Date;
    payload?: unknown;
}
export declare class N8nService {
    private readonly configService;
    private readonly logger;
    constructor(configService: ConfigService);
    createWorkflowFromTemplate(params: {
        workflow: Workflow;
        userId: string;
        config: Record<string, unknown>;
    }): Promise<{
        id: string;
    }>;
    setWorkflowActive(n8nWorkflowId: string, active: boolean): Promise<void>;
    fetchExecutionLogs(n8nWorkflowId: string, limit?: number): Promise<N8nExecutionLog[]>;
    private resolveWorkflowDefinition;
    private request;
    private isConfigured;
    private parseDate;
    private coerceId;
}
export {};
