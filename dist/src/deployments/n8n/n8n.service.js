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
var N8nService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.N8nService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let N8nService = N8nService_1 = class N8nService {
    configService;
    logger = new common_1.Logger(N8nService_1.name);
    constructor(configService) {
        this.configService = configService;
    }
    async createWorkflowFromTemplate(params) {
        if (!this.isConfigured()) {
            return { id: `mock-n8n-${params.workflow.id}` };
        }
        const definition = await this.resolveWorkflowDefinition(params.workflow, params.config);
        const created = (await this.request('/workflows', {
            method: 'POST',
            body: {
                ...definition,
                name: `${params.workflow.title} (${params.userId.slice(0, 8)})`,
            },
        }));
        if (!created.id) {
            throw new Error('n8n workflow creation did not return an id');
        }
        return { id: created.id };
    }
    async setWorkflowActive(n8nWorkflowId, active) {
        if (!this.isConfigured()) {
            return;
        }
        await this.request(`/workflows/${n8nWorkflowId}`, {
            method: 'PATCH',
            body: { active },
        });
    }
    async fetchExecutionLogs(n8nWorkflowId, limit = 20) {
        if (!this.isConfigured()) {
            return [];
        }
        const response = (await this.request(`/executions?workflowId=${encodeURIComponent(n8nWorkflowId)}&limit=${limit}`));
        const logs = Array.isArray(response.data) ? response.data : [];
        return logs.map((entry, index) => {
            const row = (entry ?? {});
            const startedAt = this.parseDate(row.startedAt);
            const stoppedAt = this.parseDate(row.stoppedAt);
            const durationMs = startedAt && stoppedAt
                ? Math.max(stoppedAt.getTime() - startedAt.getTime(), 0)
                : Number(row.duration ?? 0);
            return {
                id: this.coerceId(row.id, `${n8nWorkflowId}-${index}`),
                success: row.status === 'success',
                durationMs: Number.isFinite(durationMs) ? durationMs : 0,
                errorMessage: typeof row.error === 'string'
                    ? row.error
                    : typeof row.message === 'string'
                        ? row.message
                        : null,
                executedAt: startedAt ?? new Date(),
                payload: row,
            };
        });
    }
    async resolveWorkflowDefinition(workflow, config) {
        if (workflow.workflowFileUrl) {
            try {
                const remote = await fetch(workflow.workflowFileUrl);
                if (remote.ok) {
                    const json = (await remote.json());
                    if (json && typeof json === 'object' && !Array.isArray(json)) {
                        const parsed = json;
                        return {
                            ...parsed,
                            name: typeof parsed.name === 'string' ? parsed.name : workflow.title,
                            tags: [{ name: 'flowmarket' }],
                            settings: {
                                ...(typeof parsed.settings === 'object' &&
                                    parsed.settings &&
                                    !Array.isArray(parsed.settings)
                                    ? parsed.settings
                                    : {}),
                                executionOrder: 'v1',
                            },
                            staticData: {
                                flowmarketConfig: config,
                            },
                        };
                    }
                }
            }
            catch (error) {
                this.logger.warn(`Failed to fetch workflow template from ${workflow.workflowFileUrl}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }
        return {
            name: workflow.title,
            nodes: [],
            connections: {},
            active: false,
            settings: {},
            staticData: {
                flowmarketConfig: config,
            },
        };
    }
    async request(path, options) {
        const baseUrl = this.configService.get('N8N_BASE_URL');
        const apiKey = this.configService.get('N8N_API_KEY');
        if (!baseUrl || !apiKey) {
            throw new Error('n8n is not configured');
        }
        const response = await fetch(`${baseUrl.replace(/\/$/, '')}/api/v1${path}`, {
            method: options?.method ?? 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-N8N-API-KEY': apiKey,
            },
            body: options?.body ? JSON.stringify(options.body) : undefined,
        });
        if (!response.ok) {
            const payload = await response.text();
            throw new Error(`n8n request failed [${response.status}] ${response.statusText}: ${payload}`);
        }
        if (response.status === 204) {
            return {};
        }
        return (await response.json());
    }
    isConfigured() {
        return Boolean(this.configService.get('N8N_BASE_URL') &&
            this.configService.get('N8N_API_KEY'));
    }
    parseDate(value) {
        if (typeof value !== 'string' || !value.trim()) {
            return null;
        }
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? null : date;
    }
    coerceId(value, fallback) {
        if (typeof value === 'string' && value.trim()) {
            return value;
        }
        if (typeof value === 'number' && Number.isFinite(value)) {
            return value.toString();
        }
        return fallback;
    }
};
exports.N8nService = N8nService;
exports.N8nService = N8nService = N8nService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], N8nService);
//# sourceMappingURL=n8n.service.js.map