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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const workflow_mapper_1 = require("../workflows/workflow.mapper");
let AiService = class AiService {
    prisma;
    configService;
    client = null;
    constructor(prisma, configService) {
        this.prisma = prisma;
        this.configService = configService;
    }
    async recommendWorkflows(dto) {
        const workflows = await this.prisma.workflow.findMany({
            where: { status: client_1.WorkflowStatus.APPROVED },
            include: { seller: true },
            orderBy: [
                { isFeatured: 'desc' },
                { purchaseCount: 'desc' },
                { avgRating: 'desc' },
            ],
            take: 20,
        });
        if (!workflows.length) {
            return {
                message: 'I could not find published workflows to recommend right now.',
                recommendations: [],
            };
        }
        const mappedWorkflows = workflows.map(workflow_mapper_1.mapWorkflow);
        const claudeResponse = await this.queryClaude(dto, mappedWorkflows);
        const workflowsById = new Map(mappedWorkflows.map((workflow) => [workflow.id, workflow]));
        const recommendations = claudeResponse.recommendedWorkflowIds
            .map((id) => workflowsById.get(id))
            .filter((workflow) => workflow !== undefined);
        return {
            message: claudeResponse.message,
            recommendations,
        };
    }
    async queryClaude(dto, workflows) {
        const model = this.configService.get('ANTHROPIC_MODEL') ??
            'claude-3-5-sonnet-latest';
        const client = this.getClient();
        const catalog = workflows.map((workflow) => ({
            id: workflow.id,
            title: workflow.title,
            slug: workflow.slug,
            shortDescription: workflow.shortDescription,
            category: workflow.category,
            platform: workflow.platform,
            difficulty: workflow.difficulty,
            oneTimePrice: workflow.oneTimePrice,
            monthlyPrice: workflow.monthlyPrice,
            avgRating: workflow.avgRating,
            tags: workflow.tags,
            requiredIntegrations: workflow.requiredIntegrations,
        }));
        const history = dto.history ?? [];
        const userPrompt = [
            'User message:',
            dto.message.trim(),
            '',
            'Conversation history:',
            JSON.stringify(history),
            '',
            'Workflow catalog JSON:',
            JSON.stringify(catalog),
            '',
            'Respond strictly as JSON with this schema:',
            '{"message":"string","recommendedWorkflowIds":["workflow-id"]}',
            'Only include ids that exist in the catalog. Pick up to 3 ids.',
        ].join('\n');
        const message = await client.messages.create({
            model,
            max_tokens: 600,
            temperature: 0.2,
            system: 'You are FlowMarket AI. Recommend practical workflow automations based on user intent. Return only valid JSON.',
            messages: [{ role: 'user', content: userPrompt }],
        });
        const textBlocks = message.content.filter((block) => block.type === 'text');
        const text = textBlocks
            .map((block) => block.text)
            .join('\n')
            .trim();
        if (!text) {
            throw new common_1.BadGatewayException('Claude returned an empty response');
        }
        const parsed = this.parseClaudeJson(text);
        if (typeof parsed.message !== 'string' ||
            !Array.isArray(parsed.recommendedWorkflowIds) ||
            !parsed.recommendedWorkflowIds.every((id) => typeof id === 'string')) {
            throw new common_1.BadGatewayException('Claude response did not match expected recommendation schema');
        }
        return {
            message: parsed.message,
            recommendedWorkflowIds: Array.from(new Set(parsed.recommendedWorkflowIds.map((id) => id.trim()))).slice(0, 3),
        };
    }
    parseClaudeJson(responseText) {
        const firstBrace = responseText.indexOf('{');
        const lastBrace = responseText.lastIndexOf('}');
        if (firstBrace === -1 || lastBrace === -1 || firstBrace >= lastBrace) {
            throw new common_1.BadGatewayException('Claude response did not contain a valid JSON object');
        }
        const jsonText = responseText.slice(firstBrace, lastBrace + 1);
        try {
            return JSON.parse(jsonText);
        }
        catch {
            throw new common_1.BadGatewayException('Claude response JSON could not be parsed');
        }
    }
    getClient() {
        if (this.client) {
            return this.client;
        }
        const apiKey = this.configService.get('ANTHROPIC_API_KEY');
        if (!apiKey) {
            throw new common_1.ServiceUnavailableException('ANTHROPIC_API_KEY is not configured');
        }
        this.client = new sdk_1.default({ apiKey });
        return this.client;
    }
};
exports.AiService = AiService;
exports.AiService = AiService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService])
], AiService);
//# sourceMappingURL=ai.service.js.map