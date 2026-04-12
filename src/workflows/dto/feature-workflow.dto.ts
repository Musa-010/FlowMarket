import { IsBoolean } from 'class-validator';

export class FeatureWorkflowDto {
  @IsBoolean()
  isFeatured!: boolean;
}
