import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LlmService, LlmResponse } from './llm.service';
import {
  BLOG_CONTENT_JSON_SCHEMA,
  BLOG_CONTENT_SCHEMA_NAME,
  GeneratedBlogContent,
} from './blog-content.schema';
import {
  ModelTier,
  SUBSTITUTE_MODEL,
  TIER_DEFINITIONS,
  normalizeTier,
} from '../billing/model-tiers';
import {
  BlogPromptInput,
  buildDraftPrompt,
  buildOutlinePrompt,
  buildPolishPrompt,
} from './blog-prompts';

/** The pipeline stages a job can report. Which of them run depends on tier. */
export type GenerationStage = 'outline' | 'draft' | 'polish';

export interface BlogGenerationRequest extends BlogPromptInput {
  /**
   * Called as each stage begins, for progress reporting.
   *
   * Fired only for stages that actually run — standard tier skips the editor
   * pass, so a consumer must not assume a fixed sequence. Never allowed to
   * affect generation: a throwing or slow callback is swallowed.
   */
  onStage?: (stage: GenerationStage) => void | Promise<void>;
  /** Pricing tier ('ucuz'|'orta'|'pahalı'/aliases) or a concrete model id. */
  modelOrTier?: string;
}

export interface GenerationStageUsage {
  stage: 'outline' | 'draft' | 'polish';
  model: string;
  provider: string;
  tokensIn: number;
  tokensOut: number;
  latencyMs: number;
}

export interface BlogGenerationResult {
  blog: GeneratedBlogContent;
  /** Canonical JSON string stored in post revisions: { content, metadata } (no top-level title —
   *  jsonToMarkdown would otherwise render the H1 twice). */
  canonicalJson: string;
  model: string;
  provider: string;
  tokensIn: number;
  tokensOut: number;
  latencyMs: number;
  responseId: string;
  stages: GenerationStageUsage[];
  systemPrompt: string;
  userPrompt: string;
}

const OUTLINE_MODEL = 'gpt-4.1-mini';

@Injectable()
export class BlogGeneratorService {
  private readonly logger = new Logger(BlogGeneratorService.name);

  constructor(
    private llm: LlmService,
    private configService: ConfigService,
  ) {}

  /**
   * Resolve a tier name (or an explicit model id) to the model we will call.
   * Tier → model mapping lives in billing/model-tiers so pricing, quota and
   * generation can never disagree about what "premium" means.
   */
  resolveModel(modelOrTier?: string): string {
    const fallback =
      this.configService.get<string>('OPENAI_MODEL') || TIER_DEFINITIONS[ModelTier.STANDARD].model;
    if (!modelOrTier) return fallback;

    const tier = normalizeTier(modelOrTier);
    const resolved = tier ? TIER_DEFINITIONS[tier].model : modelOrTier;

    // Degrade gracefully when the resolved provider has no API key configured.
    const provider = this.llm.providerFor(resolved);
    if (!this.llm.isProviderAvailable(provider)) {
      const substitute = SUBSTITUTE_MODEL[provider as 'openai' | 'anthropic'];
      if (substitute && this.llm.isProviderAvailable(this.llm.providerFor(substitute))) {
        this.logger.warn(`Provider for ${resolved} not configured; substituting ${substitute}`);
        return substitute;
      }
    }
    return resolved;
  }

  async generate(request: BlogGenerationRequest): Promise<BlogGenerationResult> {
    const startTime = Date.now();
    const model = this.resolveModel(request.modelOrTier);
    const stages: GenerationStageUsage[] = [];

    // Pipeline depth: cheap tier gets outline+draft; pro/premium adds the editor pass.
    const multiStage = (this.configService.get<string>('AI_PIPELINE_MODE') || 'multi') !== 'single';
    const isPremiumish = model !== TIER_DEFINITIONS[ModelTier.STANDARD].model;

    // ── Stage 1: outline (fast model; non-fatal on failure) ─────────────────
    let outlineJson: string | null = null;
    if (multiStage) {
      await this.reportStage(request, 'outline');
      try {
        const outlineModel = this.llm.isProviderAvailable('openai') ? OUTLINE_MODEL : model;
        const prompt = buildOutlinePrompt(request);
        const res = await this.llm.complete({
          model: outlineModel,
          messages: [
            { role: 'system', content: prompt.system },
            { role: 'user', content: prompt.user },
          ],
          maxTokens: 2000,
          temperature: 0.8,
        });
        stages.push(this.stageUsage('outline', res));
        const parsed = this.extractJson(res.content);
        outlineJson = parsed ? JSON.stringify(parsed) : null;
      } catch (error) {
        this.logger.warn(
          `Outline stage failed, continuing without brief: ${(error as Error).message}`,
        );
      }
    }

    // ── Stage 2: draft (schema-enforced) ────────────────────────────────────
    await this.reportStage(request, 'draft');
    const draftPrompt = buildDraftPrompt(request, outlineJson);
    const isAnthropic = this.llm.providerFor(model) === 'anthropic';
    const draftRes = await this.llm.complete({
      model,
      messages: [
        { role: 'system', content: draftPrompt.system },
        { role: 'user', content: draftPrompt.user },
      ],
      maxTokens: isAnthropic ? 32000 : 16000,
      temperature: 0.7,
      jsonSchema: { name: BLOG_CONTENT_SCHEMA_NAME, schema: BLOG_CONTENT_JSON_SCHEMA },
    });
    stages.push(this.stageUsage('draft', draftRes));

    let blog = this.parseBlogContent(draftRes.content, request);
    let finalRes = draftRes;

    // ── Stage 3: editor pass (pro/premium only; non-fatal on failure) ───────
    if (multiStage && isPremiumish) {
      await this.reportStage(request, 'polish');
      try {
        const polishPrompt = buildPolishPrompt(request, JSON.stringify(blog));
        const polishRes = await this.llm.complete({
          model,
          messages: [
            { role: 'system', content: polishPrompt.system },
            { role: 'user', content: polishPrompt.user },
          ],
          maxTokens: isAnthropic ? 32000 : 16000,
          temperature: 0.5,
          jsonSchema: { name: BLOG_CONTENT_SCHEMA_NAME, schema: BLOG_CONTENT_JSON_SCHEMA },
        });
        stages.push(this.stageUsage('polish', polishRes));
        blog = this.parseBlogContent(polishRes.content, request, blog);
        finalRes = polishRes;
      } catch (error) {
        this.logger.warn(`Polish stage failed, keeping draft: ${(error as Error).message}`);
      }
    }

    const canonicalJson = JSON.stringify({
      content: blog.content,
      metadata: {
        excerpt: blog.excerpt,
        toc: blog.metadata.toc,
        faq: blog.metadata.faq,
        seo: blog.metadata.seo,
      },
    });

    return {
      blog,
      canonicalJson,
      model: finalRes.model,
      provider: finalRes.provider,
      tokensIn: stages.reduce((sum, s) => sum + s.tokensIn, 0),
      tokensOut: stages.reduce((sum, s) => sum + s.tokensOut, 0),
      latencyMs: Date.now() - startTime,
      responseId: finalRes.responseId,
      stages,
      systemPrompt: draftPrompt.system,
      userPrompt: draftPrompt.user,
    };
  }

  private stageUsage(stage: GenerationStageUsage['stage'], res: LlmResponse): GenerationStageUsage {
    return {
      stage,
      model: res.model,
      provider: res.provider,
      tokensIn: res.tokensIn,
      tokensOut: res.tokensOut,
      latencyMs: res.latencyMs,
    };
  }

  /** Parse model output into GeneratedBlogContent; falls back to treating output as raw markdown. */
  private parseBlogContent(
    raw: string,
    request: BlogPromptInput,
    fallback?: GeneratedBlogContent,
  ): GeneratedBlogContent {
    const parsed = this.extractJson(raw);

    if (parsed && typeof parsed.content === 'string' && parsed.content.trim()) {
      return {
        title:
          typeof parsed.title === 'string' && parsed.title.trim()
            ? parsed.title.trim()
            : this.titleFromMarkdown(parsed.content, request.topic),
        excerpt: typeof parsed.excerpt === 'string' ? parsed.excerpt.trim() : '',
        content: parsed.content.trim(),
        metadata: {
          toc: Array.isArray(parsed.metadata?.toc) ? parsed.metadata.toc : [],
          faq: Array.isArray(parsed.metadata?.faq) ? parsed.metadata.faq : [],
          seo: {
            metaTitle: parsed.metadata?.seo?.metaTitle || '',
            metaDescription: parsed.metadata?.seo?.metaDescription || '',
            ogTitle: parsed.metadata?.seo?.ogTitle || parsed.metadata?.seo?.metaTitle || '',
            ogDescription:
              parsed.metadata?.seo?.ogDescription || parsed.metadata?.seo?.metaDescription || '',
            keywords: Array.isArray(parsed.metadata?.seo?.keywords)
              ? parsed.metadata.seo.keywords
              : [],
            slug: parsed.metadata?.seo?.slug || '',
          },
        },
      };
    }

    if (fallback) {
      this.logger.warn('Could not parse model output as blog JSON; keeping previous stage result');
      return fallback;
    }

    // Last resort: treat the raw output as markdown.
    const content = raw.trim();
    return {
      title: this.titleFromMarkdown(content, request.topic),
      excerpt: '',
      content: content.startsWith('#') ? content : `# ${request.topic}\n\n${content}`,
      metadata: {
        toc: [],
        faq: [],
        seo: {
          metaTitle: '',
          metaDescription: '',
          ogTitle: '',
          ogDescription: '',
          keywords: [],
          slug: '',
        },
      },
    };
  }

  private titleFromMarkdown(markdown: string, fallbackTopic: string): string {
    const match = markdown.match(/^#\s+(.+)$/m);
    return match?.[1]?.trim() || fallbackTopic;
  }

  /**
   * Progress reporting is strictly best-effort: the callback writes to the
   * database, and a database hiccup must never cost us an article the customer
   * has already been billed for.
   */
  private async reportStage(request: BlogGenerationRequest, stage: GenerationStage): Promise<void> {
    if (!request.onStage) return;
    try {
      await request.onStage(stage);
    } catch (error) {
      this.logger.warn(`Stage reporting failed (${stage}): ${(error as Error).message}`);
    }
  }

  /** Tolerant JSON extraction: handles code fences and surrounding prose. */
  private extractJson(raw: string): any | null {
    if (!raw) return null;
    const cleaned = raw.replace(/```(?:json)?/gi, '').trim();
    try {
      return JSON.parse(cleaned);
    } catch {
      const start = cleaned.indexOf('{');
      const end = cleaned.lastIndexOf('}');
      if (start !== -1 && end > start) {
        try {
          return JSON.parse(cleaned.slice(start, end + 1));
        } catch {
          return null;
        }
      }
      return null;
    }
  }
}
