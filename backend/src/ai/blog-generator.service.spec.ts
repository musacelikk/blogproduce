import { buildDraftPrompt, buildPolishPrompt } from './blog-prompts';
import { ConfigService } from '@nestjs/config';
import { BlogGeneratorService } from './blog-generator.service';
import { LlmService } from './llm.service';
import { ModelTier, modelForTier } from '../billing/model-tiers';

/**
 * Tier→model mapping is deliberately configurable (see model-tiers.ts), so these
 * assertions read the mapping instead of hardcoding model ids. Otherwise every
 * test here breaks the day the Anthropic key is connected and the tiers move to
 * Claude — a false alarm that says nothing about whether routing still works.
 */
const STANDARD = modelForTier(ModelTier.STANDARD);
const PRO = modelForTier(ModelTier.PRO);
const PREMIUM = modelForTier(ModelTier.PREMIUM);

/** Minimal stubs — these tests cover pure routing/parsing logic, not network calls. */
function buildService(options: { anthropic?: boolean; openai?: boolean; env?: Record<string, string> } = {}) {
  const { anthropic = true, openai = true, env = {} } = options;

  const llm = {
    providerFor: (model: string) => (model.toLowerCase().startsWith('claude') ? 'anthropic' : 'openai'),
    isProviderAvailable: (provider: string) => (provider === 'anthropic' ? anthropic : openai),
  } as unknown as LlmService;

  const config = { get: (key: string) => env[key] } as unknown as ConfigService;

  return new BlogGeneratorService(llm, config);
}

describe('BlogGeneratorService.resolveModel', () => {
  it('maps quality tiers to concrete models', () => {
    const service = buildService();
    expect(service.resolveModel('standard')).toBe(STANDARD);
    expect(service.resolveModel('pro')).toBe(PRO);
    expect(service.resolveModel('premium')).toBe(PREMIUM);
  });

  it('accepts the Turkish tier aliases customers and admins actually type', () => {
    const service = buildService();
    expect(service.resolveModel('ucuz')).toBe(STANDARD);
    expect(service.resolveModel('orta')).toBe(PRO);
    expect(service.resolveModel('pahalı')).toBe(PREMIUM);
  });

  it('gives each tier a distinct model, so a paid upgrade changes something', () => {
    expect(new Set([STANDARD, PRO, PREMIUM]).size).toBe(3);
  });

  it('passes explicit model ids through untouched', () => {
    expect(buildService().resolveModel('claude-sonnet-5')).toBe('claude-sonnet-5');
  });

  it('falls back to the configured default when nothing is requested', () => {
    expect(buildService({ env: { OPENAI_MODEL: 'gpt-4.1' } }).resolveModel()).toBe('gpt-4.1');
  });

  it('substitutes a provider that is actually configured', () => {
    // A Claude-backed tier with no Anthropic key must degrade to OpenAI rather
    // than fail the generation outright.
    const withoutAnthropic = buildService({ anthropic: false });
    expect(withoutAnthropic.resolveModel('claude-opus-5').startsWith('claude')).toBe(false);

    const withoutOpenAI = buildService({ openai: false });
    expect(withoutOpenAI.resolveModel('gpt-4o').startsWith('claude')).toBe(true);
  });

  it('keeps the requested model when no substitute is available either', () => {
    const neither = buildService({ anthropic: false, openai: false });
    expect(neither.resolveModel('claude-opus-5')).toBe('claude-opus-5');
  });
});

describe('BlogGeneratorService content parsing', () => {
  const service = buildService();
  // parseBlogContent / extractJson are internal to the generation pipeline.
  const parse = (raw: string, fallback?: any) =>
    (service as any).parseBlogContent(raw, { topic: 'Test konusu' }, fallback);

  it('parses a well-formed schema response', () => {
    const raw = JSON.stringify({
      title: 'Başlık',
      excerpt: 'Özet',
      content: '# Başlık\n\nGövde',
      metadata: {
        toc: [{ id: 'bolum', title: 'Bölüm', level: 2 }],
        faq: [{ question: 'S?', answer: 'C.' }],
        seo: {
          metaTitle: 'Meta',
          metaDescription: 'Açıklama',
          ogTitle: '',
          ogDescription: '',
          keywords: ['a'],
          slug: 'baslik',
        },
      },
    });

    const result = parse(raw);
    expect(result.title).toBe('Başlık');
    expect(result.metadata.toc).toHaveLength(1);
    expect(result.metadata.seo.slug).toBe('baslik');
    // ogTitle falls back to metaTitle so integrators always get usable tags
    expect(result.metadata.seo.ogTitle).toBe('Meta');
  });

  it('recovers JSON wrapped in code fences or prose', () => {
    const raw = 'Here you go:\n```json\n{"title":"T","excerpt":"E","content":"# T\\n\\nBody","metadata":{}}\n```';
    const result = parse(raw);
    expect(result.title).toBe('T');
    expect(result.content).toContain('# T');
    expect(result.metadata.faq).toEqual([]);
  });

  it('treats unparseable output as raw markdown rather than failing', () => {
    const result = parse('# Elle yazılmış\n\nMetin gövdesi');
    expect(result.content).toContain('# Elle yazılmış');
    expect(result.title).toBe('Elle yazılmış');
  });

  it('adds an H1 when the fallback markdown has none', () => {
    const result = parse('Sadece düz metin');
    expect(result.content.startsWith('# Test konusu')).toBe(true);
  });

  it('keeps the previous stage result when a later stage returns garbage', () => {
    const fallback = {
      title: 'Draft',
      excerpt: '',
      content: '# Draft',
      metadata: { toc: [], faq: [], seo: {} },
    };
    expect(parse('', fallback)).toBe(fallback);
  });
});

describe('internal linking', () => {
  const base = { topic: 'İçerik kümesi nasıl kurulur' };

  it('says nothing about internal links when the site has no other articles', () => {
    const { system } = buildDraftPrompt(base, null);
    expect(system).not.toMatch(/INTERNAL LINKS/);
  });

  it('instructs the writer to link published articles inline', () => {
    const input = {
      ...base,
      relatedPosts: [
        { title: 'Anahtar kelime araştırması', slug: 'anahtar-kelime-arastirmasi' },
        { title: 'Teknik SEO kontrol listesi', slug: 'teknik-seo-kontrol-listesi' },
      ],
    };
    const { system, user } = buildDraftPrompt(input, null);

    expect(system).toMatch(/INTERNAL LINKS/);
    // The paths must reach the model verbatim; a model inventing slugs would
    // produce links that 404 on the customer's site.
    expect(user).toContain('/blog/anahtar-kelime-arastirmasi');
    expect(user).toContain('/blog/teknik-seo-kontrol-listesi');
  });

  it('keeps the rule in the editor pass, so polish cannot strip the links', () => {
    const input = {
      ...base,
      relatedPosts: [{ title: 'Teknik SEO', slug: 'teknik-seo' }],
    };
    const { system } = buildPolishPrompt(input, '{}');
    expect(system).toMatch(/INTERNAL LINKS/);
  });
});

/** A service whose llm.complete always returns one valid schema response. */
function buildGeneratingService(env: Record<string, string> = {}) {
  const reply = {
    content: JSON.stringify({
      title: 'Başlık',
      excerpt: 'Özet',
      content: '# Başlık\n\nGövde.',
      metadata: { toc: [], faq: [], seo: {} },
    }),
    model: 'gpt-4o-mini',
    provider: 'openai',
    tokensIn: 100,
    tokensOut: 200,
    latencyMs: 10,
    responseId: 'r',
  };
  const llm = {
    providerFor: (m: string) => (m.toLowerCase().startsWith('claude') ? 'anthropic' : 'openai'),
    isProviderAvailable: () => true,
    complete: jest.fn().mockResolvedValue(reply),
  } as unknown as LlmService;
  const config = { get: (key: string) => env[key] } as unknown as ConfigService;
  return new BlogGeneratorService(llm, config);
}

describe('pipeline stage reporting', () => {
  it('reports only the stages that actually run on the standard tier', async () => {
    const service = buildGeneratingService();
    const seen: string[] = [];

    await service.generate({
      topic: 'Konu',
      modelOrTier: ModelTier.STANDARD,
      onStage: (stage) => void seen.push(stage),
    });

    // Standard skips the editor pass, so promising the client a polish step
    // would leave its progress bar stuck on a stage that never arrives.
    expect(seen).toEqual(['outline', 'draft']);
  });

  it('reports the editor pass on a tier that runs it', async () => {
    const service = buildGeneratingService();
    const seen: string[] = [];

    await service.generate({
      topic: 'Konu',
      modelOrTier: ModelTier.PREMIUM,
      onStage: (stage) => void seen.push(stage),
    });

    expect(seen).toEqual(['outline', 'draft', 'polish']);
  });

  it('reports nothing extra in single-stage mode', async () => {
    const service = buildGeneratingService({ AI_PIPELINE_MODE: 'single' });
    const seen: string[] = [];

    await service.generate({
      topic: 'Konu',
      modelOrTier: ModelTier.PREMIUM,
      onStage: (stage) => void seen.push(stage),
    });

    expect(seen).toEqual(['draft']);
  });

  it('still produces an article when stage reporting fails', async () => {
    // The callback writes to the database. A hiccup there must not cost an
    // article the customer has already been billed for.
    const service = buildGeneratingService();

    const result = await service.generate({
      topic: 'Konu',
      modelOrTier: ModelTier.STANDARD,
      onStage: () => {
        throw new Error('db down');
      },
    });

    expect(result.blog.content).toContain('Gövde.');
  });
});
