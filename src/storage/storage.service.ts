import {
  BadGatewayException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import { CreateUploadUrlDto } from './dto/create-upload-url.dto';

@Injectable()
export class StorageService {
  private client: SupabaseClient | null = null;
  private readonly bucketName: string;

  constructor(private readonly configService: ConfigService) {
    this.bucketName =
      this.configService.get<string>('SUPABASE_STORAGE_BUCKET') ?? 'workflows';
  }

  async createUploadUrl(dto: CreateUploadUrlDto) {
    const client = this.getClient();
    const objectPath = this.buildObjectPath(dto.folder, dto.filename);

    const { data, error } = await client.storage
      .from(this.bucketName)
      .createSignedUploadUrl(objectPath);

    if (error || !data) {
      throw new BadGatewayException(
        `Failed to create signed upload URL: ${error?.message ?? 'Unknown error'}`,
      );
    }

    const {
      data: { publicUrl },
    } = client.storage.from(this.bucketName).getPublicUrl(objectPath);

    return {
      bucket: this.bucketName,
      path: data.path,
      token: data.token,
      signedUrl: data.signedUrl,
      publicUrl,
      contentType: dto.contentType ?? 'application/octet-stream',
    };
  }

  private buildObjectPath(
    folder: string | undefined,
    fileName: string,
  ): string {
    const safeFilename = fileName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, '-');

    return `${folder ?? 'workflow-files'}/${Date.now()}-${randomUUID()}-${safeFilename}`;
  }

  private getClient(): SupabaseClient {
    if (this.client) {
      return this.client;
    }

    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const serviceRoleKey = this.configService.get<string>(
      'SUPABASE_SERVICE_ROLE_KEY',
    );

    if (!supabaseUrl || !serviceRoleKey) {
      throw new ServiceUnavailableException(
        'Supabase Storage is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.',
      );
    }

    this.client = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    return this.client;
  }
}
