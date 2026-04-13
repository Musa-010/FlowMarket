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
import {
  WorkflowCategory,
  WorkflowDifficulty,
  WorkflowPlatform,
} from '@prisma/client';

export class UpdateWorkflowDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  shortDescription?: string;

  @IsOptional()
  @IsString()
  fullDescription?: string;

  @IsOptional()
  @IsEnum(WorkflowPlatform)
  platform?: WorkflowPlatform;

  @IsOptional()
  @IsEnum(WorkflowCategory)
  category?: WorkflowCategory;

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
