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
exports.StorageService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const supabase_js_1 = require("@supabase/supabase-js");
const crypto_1 = require("crypto");
let StorageService = class StorageService {
    configService;
    client = null;
    bucketName;
    constructor(configService) {
        this.configService = configService;
        this.bucketName =
            this.configService.get('SUPABASE_STORAGE_BUCKET') ?? 'workflows';
    }
    async createUploadUrl(dto) {
        const client = this.getClient();
        const objectPath = this.buildObjectPath(dto.folder, dto.filename);
        const { data, error } = await client.storage
            .from(this.bucketName)
            .createSignedUploadUrl(objectPath);
        if (error || !data) {
            throw new common_1.BadGatewayException(`Failed to create signed upload URL: ${error?.message ?? 'Unknown error'}`);
        }
        const { data: { publicUrl }, } = client.storage.from(this.bucketName).getPublicUrl(objectPath);
        return {
            bucket: this.bucketName,
            path: data.path,
            token: data.token,
            signedUrl: data.signedUrl,
            publicUrl,
            contentType: dto.contentType ?? 'application/octet-stream',
        };
    }
    buildObjectPath(folder, fileName) {
        const safeFilename = fileName
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9._-]+/g, '-');
        return `${folder ?? 'workflow-files'}/${Date.now()}-${(0, crypto_1.randomUUID)()}-${safeFilename}`;
    }
    getClient() {
        if (this.client) {
            return this.client;
        }
        const supabaseUrl = this.configService.get('SUPABASE_URL');
        const serviceRoleKey = this.configService.get('SUPABASE_SERVICE_ROLE_KEY');
        if (!supabaseUrl || !serviceRoleKey) {
            throw new common_1.ServiceUnavailableException('Supabase Storage is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
        }
        this.client = (0, supabase_js_1.createClient)(supabaseUrl, serviceRoleKey, {
            auth: {
                persistSession: false,
                autoRefreshToken: false,
            },
        });
        return this.client;
    }
};
exports.StorageService = StorageService;
exports.StorageService = StorageService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], StorageService);
//# sourceMappingURL=storage.service.js.map