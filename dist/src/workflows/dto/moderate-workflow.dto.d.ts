import { WorkflowStatus } from '@prisma/client';
export declare class ModerateWorkflowDto {
    status: WorkflowStatus;
    rejectionReason?: string;
}
