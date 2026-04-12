import { IsObject, IsOptional, IsString } from 'class-validator';

export class CreateDeploymentDto {
  @IsString()
  workflowId!: string;

  @IsOptional()
  @IsObject()
  config?: Record<string, unknown>;
}
