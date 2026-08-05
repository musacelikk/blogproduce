import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

export type LlmProvider = 'openai' | 'anthropic';

export interface LlmMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LlmRequest {
  model: string;
  messages: LlmMessage[];
  maxTokens?: number;
  /** Only applied to OpenAI models — Anthropic Claude 5 models reject sampling params. */
  temperature?: number;
  /** When set, the provider is asked to return a single JSON object matching this schema. */
  jsonSchema?: { name: string; schema: Record<string, any> };
  /** Anthropic only: reasoning depth. Ignored by OpenAI models. */
  effort?: 'low' | 'medium' | 'high' | 'xhigh' | 'max';
}

export interface LlmResponse {
  content: string;
  model: string;
  provider: LlmProvider;
  tokensIn: number;
  tokensOut: number;
  latencyMs: number;
  responseId: string;
}

export class LlmRefusalError extends Error {
  constructor(message = 'The model declined to generate this content.') {
    super(message);
    this.name = 'LlmRefusalError';
  }
}

/**
 * Provider-agnostic LLM gateway.
 * Routing rule: model ids starting with "claude" go to Anthropic, everything else to OpenAI.
 */
@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);
  private openai: OpenAI | null = null;
  private anthropic: Anthropic | null = null;

  constructor(private configService: ConfigService) {
    const openaiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (openaiKey) {
      this.openai = new OpenAI({ apiKey: openaiKey });
    } else {
      this.logger.warn('OPENAI_API_KEY not configured — OpenAI models unavailable');
    }

    const anthropicKey = this.configService.get<string>('ANTHROPIC_API_KEY');
    if (anthropicKey) {
      this.anthropic = new Anthropic({ apiKey: anthropicKey });
    } else {
      this.logger.warn('ANTHROPIC_API_KEY not configured — Claude models unavailable, premium tier falls back to OpenAI');
    }
  }

  providerFor(model: string): LlmProvider {
    return model.toLowerCase().startsWith('claude') ? 'anthropic' : 'openai';
  }

  isProviderAvailable(provider: LlmProvider): boolean {
    return provider === 'anthropic' ? this.anthropic !== null : this.openai !== null;
  }

  async complete(request: LlmRequest): Promise<LlmResponse> {
    const provider = this.providerFor(request.model);
    const startTime = Date.now();

    const response =
      provider === 'anthropic'
        ? await this.completeAnthropic(request)
        : await this.completeOpenAI(request);

    return { ...response, latencyMs: Date.now() - startTime };
  }

  private async completeOpenAI(request: LlmRequest): Promise<Omit<LlmResponse, 'latencyMs'>> {
    if (!this.openai) {
      throw new Error('OpenAI client not initialized. Check OPENAI_API_KEY configuration.');
    }

    const params: OpenAI.Chat.ChatCompletionCreateParamsNonStreaming = {
      model: request.model,
      messages: request.messages.map((m) => ({ role: m.role, content: m.content })),
      max_tokens: request.maxTokens ?? 8000,
      temperature: request.temperature ?? 0.7,
    };

    if (request.jsonSchema) {
      params.response_format = {
        type: 'json_schema',
        json_schema: {
          name: request.jsonSchema.name,
          strict: true,
          schema: request.jsonSchema.schema,
        },
      } as any;
    }

    const completion = await this.openai.chat.completions.create(params);
    const content = completion.choices[0]?.message?.content || '';

    return {
      content,
      model: completion.model,
      provider: 'openai',
      tokensIn: completion.usage?.prompt_tokens || 0,
      tokensOut: completion.usage?.completion_tokens || 0,
      responseId: completion.id,
    };
  }

  private async completeAnthropic(request: LlmRequest): Promise<Omit<LlmResponse, 'latencyMs'>> {
    if (!this.anthropic) {
      throw new Error('Anthropic client not initialized. Check ANTHROPIC_API_KEY configuration.');
    }

    const systemText = request.messages
      .filter((m) => m.role === 'system')
      .map((m) => m.content)
      .join('\n\n');
    const conversation = request.messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

    // fallbacks: "default" — if Anthropic's safety classifiers decline a request,
    // it is automatically re-run on the recommended fallback model server-side.
    // Thinking is on by default on Claude 5 models and counts against max_tokens,
    // so the budget has to cover reasoning *and* a full-length article.
    const outputConfig: Record<string, any> = { effort: request.effort ?? 'high' };
    if (request.jsonSchema) {
      outputConfig.format = { type: 'json_schema', schema: request.jsonSchema.schema };
    }

    const params: any = {
      model: request.model,
      max_tokens: request.maxTokens ?? 32000,
      // If Anthropic's safety classifiers decline the request, it is re-run
      // server-side on the recommended fallback model instead of failing.
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: outputConfig,
      ...(systemText ? { system: systemText } : {}),
      messages: conversation,
    };

    const response: any = await this.anthropic.beta.messages.create(params);

    if (response.stop_reason === 'refusal') {
      throw new LlmRefusalError();
    }

    const content = (response.content || [])
      .filter((block: any) => block.type === 'text')
      .map((block: any) => block.text)
      .join('');

    return {
      content,
      model: response.model,
      provider: 'anthropic',
      tokensIn: response.usage?.input_tokens || 0,
      tokensOut: response.usage?.output_tokens || 0,
      responseId: response.id,
    };
  }
}
