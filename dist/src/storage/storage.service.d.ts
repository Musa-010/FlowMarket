import { ConfigService } from '@nestjs/config';
import { CreateUploadUrlDto } from './dto/create-upload-url.dto';
export declare class StorageService {
    private readonly configService;
    private client;
    private readonly bucketName;
    constructor(configService: ConfigService);
    createUploadUrl(dto: CreateUploadUrlDto): Promise<{
        bucket: string;
        path: string;
        token: string;
        signedUrl: string;
        publicUrl: string;
        contentType: string;
    }>;
    private buildObjectPath;
    private getClient;
}
