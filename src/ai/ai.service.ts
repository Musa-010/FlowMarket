import {
  BadGatewayException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WorkflowStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { mapWorkflow, WorkflowResponse } from '../workflows/workflow.mapper';
import { RecommendWorkflowDto } from './dto/recommend-workflow.dto';

interface RecommendationResponse {
  message: string;
  recommendedWorkflowIds: string[];
}

interface OpenRouterResponse {
  choices?: {
    message?: {
      content?: string;
    };
  }[];
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) { }

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
    const aiResponse = await this.queryOpenRouter(dto, mappedWorkflows);

    const workflowsById = new Map(
      mappedWorkflows.map((workflow) => [workflow.id, workflow]),
    );
    const recommendations = aiResponse.recommendedWorkflowIds
      .map((id) => workflowsById.get(id))
      .filter((workflow): workflow is WorkflowResponse => workflow !== undefined);

    return {
      message: aiResponse.message,
      recommendations,
    };
  }

  private async queryOpenRouter(
    dto: RecommendWorkflowDto,
    workflows: WorkflowResponse[],
  ): Promise<RecommendationResponse> {
    const apiKey = this.configService.get<string>('OPENROUTER_API_KEY');
    if (!apiKey) {
      throw new ServiceUnavailableException(
        'OPENROUTER_API_KEY is not configured',
      );
    }

    const model =
      this.configService.get<string>('OPENROUTER_MODEL') ??
      'nvidia/nemotron-3-super-120b-a12b:free';

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
    const systemPrompt =
      'You are FlowMarket AI. Recommend practical workflow automations based on user intent. Respond strictly in JSON format.';

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

    try {
      // Use global.fetch or cast to any to avoid "fetch not found" TS errors if lib is missing
      const response = await (global as any).fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://flowmarket.io',
          'X-Title': 'FlowMarket',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          response_format: { type: 'json_object' },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        this.logger.error(`OpenRouter API error: ${response.status} ${JSON.stringify(errorData)}`);
        throw new BadGatewayException(`OpenRouter API returned ${response.status}`);
      }

      const data = (await response.json()) as OpenRouterResponse;
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        throw new BadGatewayException('OpenRouter returned an empty response');
      }

      const parsed: any = this.parseJson(content);

      if (typeof parsed.message !== 'string') {
        throw new BadGatewayException(
          'AI response did not match expected recommendation schema',
        );
      }

      const ids: string[] = Array.isArray(parsed.recommendedWorkflowIds)
        ? parsed.recommendedWorkflowIds.filter((id: any) => typeof id === 'string')
        : [];

      return {
        message: parsed.message,
        recommendedWorkflowIds: Array.from(new Set(ids.map((id) => id.trim()))).slice(0, 3),
      };
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`AI recommendation failed: ${errorMessage}`, error instanceof Error ? error.stack : undefined);

      if (error instanceof ServiceUnavailableException || error instanceof BadGatewayException) {
        throw error;
      }
      throw new BadGatewayException(`AI Assistant unavailable: ${errorMessage}`);
    }
  }

  private parseJson(responseText: string): any {
    const firstBrace = responseText.indexOf('{');
    const lastBrace = responseText.lastIndexOf('}');
    if (firstBrace === -1 || lastBrace === -1 || firstBrace >= lastBrace) {
      throw new BadGatewayException(
        'AI response did not contain a valid JSON object',
      );
    }

    const jsonText = responseText.slice(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(jsonText);
    } catch {
      throw new BadGatewayException('AI response JSON could not be parsed');
    }
  }
}
