import { IsOptional, IsString, MaxLength } from 'class-validator';

export class RegisterDeviceTokenDto {
  @IsString()
  @MaxLength(4096)
  token!: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  platform?: string;
}
