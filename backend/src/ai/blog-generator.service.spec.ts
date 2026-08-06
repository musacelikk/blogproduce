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
