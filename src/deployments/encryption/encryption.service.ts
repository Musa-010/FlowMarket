import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from 'crypto';

interface EncryptedPayload {
  encrypted: string;
  iv: string;
  authTag: string;
}

@Injectable()
export class EncryptionService {
  constructor(private readonly configService: ConfigService) {}

  encryptObject(value: Record<string, unknown>): EncryptedPayload {
    const key = this.resolveKey();
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', key, iv);

    const plaintext = JSON.stringify(value);
    const encrypted = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);

    return {
      encrypted: encrypted.toString('base64'),
      iv: iv.toString('base64'),
      authTag: cipher.getAuthTag().toString('base64'),
    };
  }

  decryptObject(payload: EncryptedPayload): Record<string, unknown> {
    const key = this.resolveKey();
    const decipher = createDecipheriv(
      'aes-256-gcm',
      key,
      Buffer.from(payload.iv, 'base64'),
    );

    decipher.setAuthTag(Buffer.from(payload.authTag, 'base64'));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(payload.encrypted, 'base64')),
      decipher.final(),
    ]).toString('utf8');

    const parsed = JSON.parse(decrypted) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {};
    }

    return parsed as Record<string, unknown>;
  }

  private resolveKey(): Buffer {
    const configuredKey = this.configService.get<string>('ENCRYPTION_KEY');
    if (!configuredKey) {
      throw new ServiceUnavailableException(
        'ENCRYPTION_KEY is not configured for secure deployment config storage',
      );
    }

    const trimmed = configuredKey.trim();

    try {
      const base64 = Buffer.from(trimmed, 'base64');
      if (base64.length === 32) {
        return base64;
      }
    } catch {
      // ignore and continue
    }

    if (/^[0-9a-fA-F]{64}$/.test(trimmed)) {
      return Buffer.from(trimmed, 'hex');
    }

    return createHash('sha256').update(trimmed).digest();
  }
}
