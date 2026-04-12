import { WorkflowCategory, WorkflowPlatform } from '@prisma/client';
import {
  IsEnum,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

const sortableValues = [
  'newest',
  'price_asc',
  'price_desc',
  'rating_desc',
  'popular_desc',
] as const;

export class QueryWorkflowsDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @IsOptional()
  @IsEnum(WorkflowCategory)
  category?: WorkflowCategory;

  @IsOptional()
  @IsEnum(WorkflowPlatform)
  platform?: WorkflowPlatform;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minRating?: number;

  @IsOptional()
  @IsIn(sortableValues)
  sort?: (typeof sortableValues)[number];
}
