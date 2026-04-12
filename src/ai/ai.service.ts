import {
  BadGatewayException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { WorkflowStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { mapWorkflow } from '../workflows/workflow.mapper';
import { RecommendWorkflowDto } from './dto/recommend-workflow.dto';

interface ClaudeRecommendationPayload {
  message: string;
  recommendedWorkflowIds: string[];
}

@Injectable()
export class AiService {
  private client: Anthropic | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async recommendWorkflows(dto: RecommendWorkflowDto) {
    const workflows = await this.prisma.workflow.findMany({
      where: { status: WorkflowStatus.APPROVED },
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

    const mappedWorkflows = workflows.map(mapWorkflow);
    const claudeResponse = await this.queryClaude(dto, mappedWorkflows);

    const workflowsById = new Map(
      mappedWorkflows.map((workflow) => [workflow.id, workflow]),
    );
    const recommendations = claudeResponse.recommendedWorkflowIds
      .map((id) => workflowsById.get(id))
      .filter((workflow) => workflow !== undefined);

    return {
      message: claudeResponse.message,
      recommendations,
    };
  }

  private async queryClaude(
    dto: RecommendWorkflowDto,
    workflows: ReturnType<typeof mapWorkflow>[],
  ): Promise<ClaudeRecommendationPayload> {
    const model =
      this.configService.get<string>('ANTHROPIC_MODEL') ??
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
      system:
        'You are FlowMarket AI. Recommend practical workflow automations based on user intent. Return only valid JSON.',
      messages: [{ role: 'user', content: userPrompt }],
    });

    const textBlocks = message.content.filter((block) => block.type === 'text');
    const text = textBlocks
      .map((block) => block.text)
      .join('\n')
      .trim();

    if (!text) {
      throw new BadGatewayException('Claude returned an empty response');
    }

    const parsed = this.parseClaudeJson(text);

    if (
      typeof parsed.message !== 'string' ||
      !Array.isArray(parsed.recommendedWorkflowIds) ||
      !parsed.recommendedWorkflowIds.every((id) => typeof id === 'string')
    ) {
      throw new BadGatewayException(
        'Claude response did not match expected recommendation schema',
      );
    }

    return {
      message: parsed.message,
      recommendedWorkflowIds: Array.from(
        new Set(parsed.recommendedWorkflowIds.map((id) => id.trim())),
      ).slice(0, 3),
    };
  }

  private parseClaudeJson(responseText: string): ClaudeRecommendationPayload {
    const firstBrace = responseText.indexOf('{');
    const lastBrace = responseText.lastIndexOf('}');
    if (firstBrace === -1 || lastBrace === -1 || firstBrace >= lastBrace) {
      throw new BadGatewayException(
        'Claude response did not contain a valid JSON object',
      );
    }

    const jsonText = responseText.slice(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(jsonText) as ClaudeRecommendationPayload;
    } catch {
      throw new BadGatewayException('Claude response JSON could not be parsed');
    }
  }

  private getClient(): Anthropic {
    if (this.client) {
      return this.client;
    }

    const apiKey = this.configService.get<string>('ANTHROPIC_API_KEY');
    if (!apiKey) {
      throw new ServiceUnavailableException(
        'ANTHROPIC_API_KEY is not configured',
      );
    }

    this.client = new Anthropic({ apiKey });
    return this.client;
  }
}
