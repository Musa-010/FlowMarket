import { WorkflowStatus } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';
import { QueryWorkflowsDto } from './query-workflows.dto';

export class AdminQueryWorkflowsDto extends QueryWorkflowsDto {
  @IsOptional()
  @IsEnum(WorkflowStatus)
  status?: WorkflowStatus;
}
