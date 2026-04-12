import { IsOptional, IsUrl } from 'class-validator';

export class CreateCustomerPortalDto {
  @IsOptional()
  @IsUrl()
  returnUrl?: string;
}
