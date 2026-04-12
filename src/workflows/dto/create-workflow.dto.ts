import {
  WorkflowCategory,
  WorkflowDifficulty,
  WorkflowPlatform,
} from '@prisma/client';
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateWorkflowDto {
  @IsString()
  @MaxLength(120)
  title!: string;

  @IsString()
  @MaxLength(180)
  shortDescription!: string;

  @IsOptional()
  @IsString()
  fullDescription?: string;

  @IsEnum(WorkflowPlatform)
  platform!: WorkflowPlatform;

  @IsEnum(WorkflowCategory)
  category!: WorkflowCategory;

  @IsOptional()
  @IsEnum(WorkflowDifficulty)
  difficulty?: WorkflowDifficulty;

  @IsOptional()
  @IsNumber()
  @Min(0)
  oneTimePrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  monthlyPrice?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  previewImages?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requiredIntegrations?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  steps?: string[];

  @IsOptional()
  @IsUrl()
  demoVideoUrl?: string;

  @IsOptional()
  @IsUrl()
  workflowFileUrl?: string;

  @IsOptional()
  @IsString()
  setupTime?: string;
}
