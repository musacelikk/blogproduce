import { TopicPlannerService } from './topic-planner.service';
import { AutopilotConfig } from '../entities/autopilot-config.entity';
import { calculateCostUsd } from '../billing/model-tiers';

/**
 * Autopilot's planning cost is the one place a careless change could multiply
 * spend without anything looking broken: the article pipeline is metered and
 * capped, planning is not. These tests pin the two decisions that keep it cheap
 * — one call per batch, always on the cheapest model — and the deduplication
 * that stops the batch being wasted on topics the site already covers.
 */

function makeConfig(overrides: Partial<AutopilotConfig> = {}): AutopilotConfig {
  return {
    id: 'cfg-1',
    siteId: 'site-1',
    workspaceId: 'ws-1',
    userId: 'user-1',
    tier: 'standard',
    language: 'tr',
    niche: 'SaaS pazarlama',
    targetAudience: 'KOBİ sahipleri',
    keywords: 'seo, içerik pazarlama',
    excludedTopics: 'kripto',
    ...overrides,
  } as AutopilotConfig;
}

function harness(
  opts: {
    topics?: Array<{ title: string; angle: string; primaryKeyword: string }>;
    existingPostTitles?: string[];
    existingIdeaTitles?: string[];
  } = {},
) {
  const topics = opts.topics ?? [
    { title: 'SEO için içerik kümesi nasıl kurulur', angle: 'a', primaryKeyword: 'içerik kümesi' },
    { title: 'E-posta listesi büyütmenin 7 yolu', angle: 'b', primaryKeyword: 'e-posta listesi' },
  ];

  const llm = {
    complete: jest.fn().mockResolvedValue({
      content: JSON.stringify({ topics }),
      model: 'gpt-4o-mini',
      provider: 'openai',
      tokensIn: 1500,
      tokensOut: 2000,
      latencyMs: 900,
      responseId: 'resp-1',
    }),
  };

  const usageService = { recordUsage: jest.fn().mockResolvedValue({}) };

  const saved: any[] = [];
  const topicRepository = {
    create: jest.fn((row: any) => row),
    save: jest.fn((rows: any) => {
      saved.push(...(Array.isArray(rows) ? rows : [rows]));
      return Promise.resolve(rows);
    }),
    count: jest.fn().mockResolvedValue(0),
    find: jest.fn().mockResolvedValue((opts.existingIdeaTitles ?? []).map((title) => ({ title }))),
  };

  const configRepository = { update: jest.fn().mockResolvedValue({ affected: 1 }) };
  const postRepository = {
    find: jest.fn().mockResolvedValue((opts.existingPostTitles ?? []).map((title) => ({ title }))),
  };
  const siteRepository = {
    findOne: jest.fn().mockResolvedValue({
      id: 'site-1',
      name: 'Acme Blog',
      domain: 'acme.com',
      description: 'SaaS pazarlama araçları',
    }),
  };

  const service = new TopicPlannerService(
    llm as any,
    usageService as any,
    topicRepository as any,
    configRepository as any,
    postRepository as any,
    siteRepository as any,
  );

  return { service, llm, usageService, topicRepository, saved };
}

describe('topic planning cost', () => {
  it('plans the whole batch in a single model call', async () => {
    // One call per batch is the difference between planning costing ~$0.0014 and
    // ~$0.035 for the same 25 articles.
    const h = harness();
    await h.service.planBatch(makeConfig(), 25);

    expect(h.llm.complete).toHaveBeenCalledTimes(1);
  });

  it('plans on the cheapest model even when the config buys a premium tier', async () => {
    const h = harness();
    await h.service.planBatch(makeConfig({ tier: 'premium' }), 25);

    const request = h.llm.complete.mock.calls[0][0];
    expect(request.model).toBe('gpt-4o-mini');
  });

  it('keeps a planning batch under a cent', async () => {
    // Guards the actual claim made to the user. 1.5K in / 2K out on gpt-4o-mini.
    const cost = calculateCostUsd('gpt-4o-mini', 1500, 2000);
    expect(cost).toBeLessThan(0.01);
  });

  it('asks for a schema-constrained response so the batch is never re-run', async () => {
    const h = harness();
    await h.service.planBatch(makeConfig(), 25);

    const request = h.llm.complete.mock.calls[0][0];
    expect(request.jsonSchema).toBeDefined();
    expect(request.jsonSchema.schema.additionalProperties).toBe(false);
  });

  it('puts planning spend on the ledger', async () => {
    const h = harness();
    await h.service.planBatch(makeConfig(), 25);

    expect(h.usageService.recordUsage).toHaveBeenCalledWith('user-1', 'gpt-4o-mini', 1500, 2000);
  });
});

describe('topic deduplication', () => {
  it('drops topics the site has already published', async () => {
    const h = harness({
      topics: [
        { title: 'SEO için içerik kümesi nasıl kurulur', angle: 'a', primaryKeyword: 'k' },
        { title: 'Tamamen yeni bir konu', angle: 'b', primaryKeyword: 'k2' },
      ],
      existingPostTitles: ['SEO için içerik kümesi nasıl kurulur'],
    });

    const added = await h.service.planBatch(makeConfig(), 25);

    expect(added).toBe(1);
    expect(h.saved.map((r) => r.title)).toEqual(['Tamamen yeni bir konu']);
  });

  it('drops a topic the model repeated inside one batch', async () => {
    const h = harness({
      topics: [
        { title: 'Aynı konu', angle: 'a', primaryKeyword: 'k' },
        { title: 'aynı konu', angle: 'b', primaryKeyword: 'k' },
      ],
    });

    const added = await h.service.planBatch(makeConfig(), 25);

    expect(added).toBe(1);
  });

  it('returns zero rather than throwing when the response is unusable', async () => {
    const h = harness();
    h.llm.complete.mockResolvedValue({
      content: 'not json at all',
      model: 'gpt-4o-mini',
      provider: 'openai',
      tokensIn: 10,
      tokensOut: 5,
      latencyMs: 100,
      responseId: 'r',
    });

    await expect(h.service.planBatch(makeConfig(), 25)).resolves.toBe(0);
  });
});
