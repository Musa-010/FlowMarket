import { WorkflowStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class ModerateWorkflowDto {
  @IsEnum(WorkflowStatus)
  status!: WorkflowStatus;

  @IsOptional()
  @IsString()
  @MaxLength(400)
  rejectionReason?: string;
}
