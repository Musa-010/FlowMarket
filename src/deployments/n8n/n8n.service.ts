import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Workflow } from '@prisma/client';

interface N8nExecutionLog {
  id: string;
  success: boolean;
  durationMs: number;
  errorMessage: string | null;
  executedAt: Date;
  payload?: unknown;
}

@Injectable()
export class N8nService {
  private readonly logger = new Logger(N8nService.name);

  constructor(private readonly configService: ConfigService) {}

  async createWorkflowFromTemplate(params: {
    workflow: Workflow;
    userId: string;
    config: Record<string, unknown>;
  }): Promise<{ id: string }> {
    if (!this.isConfigured()) {
      return { id: `mock-n8n-${params.workflow.id}` };
    }

    const definition = await this.resolveWorkflowDefinition(
      params.workflow,
      params.config,
    );

    const created = (await this.request('/workflows', {
      method: 'POST',
      body: {
        ...definition,
        name: `${params.workflow.title} (${params.userId.slice(0, 8)})`,
      },
    })) as { id?: string };

    if (!created.id) {
      throw new Error('n8n workflow creation did not return an id');
    }

    return { id: created.id };
  }

  async setWorkflowActive(
    n8nWorkflowId: string,
    active: boolean,
  ): Promise<void> {
    if (!this.isConfigured()) {
      return;
    }

    await this.request(`/workflows/${n8nWorkflowId}`, {
      method: 'PATCH',
      body: { active },
    });
  }

  async fetchExecutionLogs(
    n8nWorkflowId: string,
    limit = 20,
  ): Promise<N8nExecutionLog[]> {
    if (!this.isConfigured()) {
      return [];
    }

    const response = (await this.request(
      `/executions?workflowId=${encodeURIComponent(n8nWorkflowId)}&limit=${limit}`,
    )) as { data?: unknown[] };

    const logs = Array.isArray(response.data) ? response.data : [];
    return logs.map((entry, index) => {
      const row = (entry ?? {}) as Record<string, unknown>;
      const startedAt = this.parseDate(row.startedAt);
      const stoppedAt = this.parseDate(row.stoppedAt);
      const durationMs =
        startedAt && stoppedAt
          ? Math.max(stoppedAt.getTime() - startedAt.getTime(), 0)
          : Number(row.duration ?? 0);

      return {
        id: this.coerceId(row.id, `${n8nWorkflowId}-${index}`),
        success: row.status === 'success',
        durationMs: Number.isFinite(durationMs) ? durationMs : 0,
        errorMessage:
          typeof row.error === 'string'
            ? row.error
            : typeof row.message === 'string'
              ? row.message
              : null,
        executedAt: startedAt ?? new Date(),
        payload: row,
      };
    });
  }

  private async resolveWorkflowDefinition(
    workflow: Workflow,
    config: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    if (workflow.workflowFileUrl) {
      try {
        const remote = await fetch(workflow.workflowFileUrl);
        if (remote.ok) {
          const json = (await remote.json()) as unknown;
          if (json && typeof json === 'object' && !Array.isArray(json)) {
            const parsed = json as Record<string, unknown>;
            return {
              ...parsed,
              name:
                typeof parsed.name === 'string' ? parsed.name : workflow.title,
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
      } catch (error) {
        this.logger.warn(
          `Failed to fetch workflow template from ${workflow.workflowFileUrl}: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
        );
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

  private async request(
    path: string,
    options?: { method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'; body?: unknown },
  ): Promise<unknown> {
    const baseUrl = this.configService.get<string>('N8N_BASE_URL');
    const apiKey = this.configService.get<string>('N8N_API_KEY');
    if (!baseUrl || !apiKey) {
      throw new Error('n8n is not configured');
    }

    const response = await fetch(
      `${baseUrl.replace(/\/$/, '')}/api/v1${path}`,
      {
        method: options?.method ?? 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-N8N-API-KEY': apiKey,
        },
        body: options?.body ? JSON.stringify(options.body) : undefined,
      },
    );

    if (!response.ok) {
      const payload = await response.text();
      throw new Error(
        `n8n request failed [${response.status}] ${response.statusText}: ${payload}`,
      );
    }

    if (response.status === 204) {
      return {};
    }

    return (await response.json()) as unknown;
  }

  private isConfigured(): boolean {
    return Boolean(
      this.configService.get<string>('N8N_BASE_URL') &&
      this.configService.get<string>('N8N_API_KEY'),
    );
  }

  private parseDate(value: unknown): Date | null {
    if (typeof value !== 'string' || !value.trim()) {
      return null;
    }
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  private coerceId(value: unknown, fallback: string): string {
    if (typeof value === 'string' && value.trim()) {
      return value;
    }
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value.toString();
    }
    return fallback;
  }
}
