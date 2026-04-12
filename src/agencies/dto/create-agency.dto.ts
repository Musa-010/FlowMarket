import { IsString, IsOptional } from 'class-validator';

export class CreateAgencyDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  domain?: string;

  @IsString()
  ownerId!: string;

  @IsOptional()
  @IsString()
  brandLogoUrl?: string;
}
