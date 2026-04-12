"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EncryptionService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const crypto_1 = require("crypto");
let EncryptionService = class EncryptionService {
    configService;
    constructor(configService) {
        this.configService = configService;
    }
    encryptObject(value) {
        const key = this.resolveKey();
        const iv = (0, crypto_1.randomBytes)(12);
        const cipher = (0, crypto_1.createCipheriv)('aes-256-gcm', key, iv);
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
    decryptObject(payload) {
        const key = this.resolveKey();
        const decipher = (0, crypto_1.createDecipheriv)('aes-256-gcm', key, Buffer.from(payload.iv, 'base64'));
        decipher.setAuthTag(Buffer.from(payload.authTag, 'base64'));
        const decrypted = Buffer.concat([
            decipher.update(Buffer.from(payload.encrypted, 'base64')),
            decipher.final(),
        ]).toString('utf8');
        const parsed = JSON.parse(decrypted);
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
            return {};
        }
        return parsed;
    }
    resolveKey() {
        const configuredKey = this.configService.get('ENCRYPTION_KEY');
        if (!configuredKey) {
            throw new common_1.ServiceUnavailableException('ENCRYPTION_KEY is not configured for secure deployment config storage');
        }
        const trimmed = configuredKey.trim();
        try {
            const base64 = Buffer.from(trimmed, 'base64');
            if (base64.length === 32) {
                return base64;
            }
        }
        catch {
        }
        if (/^[0-9a-fA-F]{64}$/.test(trimmed)) {
            return Buffer.from(trimmed, 'hex');
        }
        return (0, crypto_1.createHash)('sha256').update(trimmed).digest();
    }
};
exports.EncryptionService = EncryptionService;
exports.EncryptionService = EncryptionService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], EncryptionService);
//# sourceMappingURL=encryption.service.js.map