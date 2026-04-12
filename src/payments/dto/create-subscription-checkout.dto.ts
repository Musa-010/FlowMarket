import { IsString } from 'class-validator';

export class CreateSubscriptionCheckoutDto {
  @IsString()
  planId!: string;
}
