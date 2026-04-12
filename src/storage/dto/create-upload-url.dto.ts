import {
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

const uploadFolders = [
  'workflow-files',
  'workflow-images',
  'workflow-previews',
] as const;

export class CreateUploadUrlDto {
  @IsString()
  @MaxLength(180)
  @Matches(/^[^/\\]+$/, {
    message: 'filename must not contain path separators',
  })
  filename!: string;

  @IsOptional()
  @IsIn(uploadFolders)
  folder?: (typeof uploadFolders)[number];

  @IsOptional()
  @IsString()
  @MaxLength(120)
  contentType?: string;
}
