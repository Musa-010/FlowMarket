import { IsObject } from 'class-validator';

export class ConfigureDeploymentDto {
  @IsObject()
  config!: Record<string, unknown>;
}
