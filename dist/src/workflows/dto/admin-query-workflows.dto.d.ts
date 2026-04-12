import { WorkflowStatus } from '@prisma/client';
import { QueryWorkflowsDto } from './query-workflows.dto';
export declare class AdminQueryWorkflowsDto extends QueryWorkflowsDto {
    status?: WorkflowStatus;
}
