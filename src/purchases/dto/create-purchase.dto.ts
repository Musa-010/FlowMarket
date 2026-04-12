import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreatePurchaseDto {
  @IsString()
  workflowId!: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  pricePaid?: number;

  @IsOptional()
  @IsString()
  stripePaymentId?: string;
}
