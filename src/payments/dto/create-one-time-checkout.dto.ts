import { IsString } from 'class-validator';

export class CreateOneTimeCheckoutDto {
  @IsString()
  workflowId!: string;
}
