import type { Request } from 'express';
import { CreateUploadUrlDto } from './dto/create-upload-url.dto';
import { StorageService } from './storage.service';
export declare class StorageController {
    private readonly storageService;
    constructor(storageService: StorageService);
    createUploadUrl(req: Request, dto: CreateUploadUrlDto): Promise<{
        bucket: string;
        path: string;
        token: string;
        signedUrl: string;
        publicUrl: string;
        contentType: string;
    }>;
}
