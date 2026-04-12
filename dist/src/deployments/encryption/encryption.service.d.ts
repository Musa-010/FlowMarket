import { ConfigService } from '@nestjs/config';
interface EncryptedPayload {
    encrypted: string;
    iv: string;
    authTag: string;
}
export declare class EncryptionService {
    private readonly configService;
    constructor(configService: ConfigService);
    encryptObject(value: Record<string, unknown>): EncryptedPayload;
    decryptObject(payload: EncryptedPayload): Record<string, unknown>;
    private resolveKey;
}
export {};
