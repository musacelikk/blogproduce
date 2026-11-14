import { ForbiddenException } from '@nestjs/common';
import { AutopilotService, buildContext } from './autopilot.service';
import { AutopilotConfig } from '../entities/autopilot-config.entity';
import { TopicIdea, TopicIdeaStatus } from '../entities/topic-idea.entity';

/**
 * These tests assert autopilot's spend guarantees rather than its plumbing:
 * that it cannot exceed a monthly cap, cannot be run twice by the two processes
 * that both host its cron, and cannot burn a planned topic on a billing error.
 * Those are the failures that cost real money.
 */

/** Mocks the `createQueryBuilder().update()...execute()` chain, returning `affected`. */
function queryBuilderReturning(affected: number) {
  const chain: any = {
    update: () => chain,
    set: () => chain,
    where: () => chain,
    andWhere: () => chain,
    execute: jest.fn().mockResolvedValue({ affected }),
  };
  return chain;
}

function makeConfig(overrides: Partial<AutopilotConfig> = {}): AutopilotConfig {
  return {
    id: 'cfg-1',
    siteId: 'site-1',
    workspaceId: 'ws-1',
    userId: 'user-1',
    enabled: true,
    postsPerWeek: 7,
    maxPostsPerMonth: 10,
    postsThisMonth: 0,
    monthAnchor: null,
    tier: 'standard',
    language: 'tr',
    tone: 'professional',
    length: 'medium',
    seoMode: true,
    autoPublish: false,
    niche: null,
    targetAudience: null,
    keywords: null,
    excludedTopics: null,
    promotion: null,
    lastRunAt: null,
    topicsPlannedAt: null,
    lastError: null,
    ...overrides,
  } as AutopilotConfig;
}

function makeTopic(overrides: Partial<TopicIdea> = {}): TopicIdea {
  return {
    id: 'topic-1',
    configId: 'cfg-1',
    title: 'Test konusu',
    slug: 'test-konusu',
    angle: 'Bir açı',
    primaryKeyword: 'test',
    status: TopicIdeaStatus.PLANNED,
    postId: null,
    attempts: 0,
    usedAt: null,
    ...overrides,
  } as TopicIdea;
}

interface Harness {
  service: AutopilotService;
  configRepo: any;
  topicRepo: any;
  postRepo: any;
  postsService: any;
  planner: any;
  unsplash: any;
}

function harness(
  opts: {
    configs?: AutopilotConfig[];
    topic?: TopicIdea | null;
    claimAffected?: number;
    generateImpl?: jest.Mock;
    plannedCount?: number;
    autopilotEnabled?: string;
  } = {},
): Harness {
  const configs = opts.configs ?? [makeConfig()];

  const configRepo = {
    find: jest.fn().mockResolvedValue(configs),
    findOne: jest.fn().mockResolvedValue(configs[0] ?? null),
    update: jest.fn().mockResolvedValue({ affected: 1 }),
    increment: jest.fn().mockResolvedValue({ affected: 1 }),
    save: jest.fn((c: any) => Promise.resolve(c)),
    create: jest.fn((c: any) => c),
    createQueryBuilder: jest.fn(() => queryBuilderReturning(opts.claimAffected ?? 1)),
  };

  const topicRepo = {
    findOne: jest.fn().mockResolvedValue(opts.topic === undefined ? makeTopic() : opts.topic),
    find: jest.fn().mockResolvedValue([]),
    update: jest.fn().mockResolvedValue({ affected: 1 }),
    count: jest.fn().mockResolvedValue(opts.plannedCount ?? 20),
  };

  const postRepo = {
    createQueryBuilder: jest.fn(() => queryBuilderReturning(1)),
    find: jest.fn().mockResolvedValue([]),
  };

  const postsService = {
    generate:
      opts.generateImpl ??
      jest.fn().mockResolvedValue({ jobId: 'job-1', postId: 'post-1', status: 'queued' }),
  };

  const planner = {
    plannedCount: jest.fn().mockResolvedValue(opts.plannedCount ?? 20),
    planBatch: jest.fn().mockResolvedValue(25),
  };

  const configService = {
    get: jest.fn((key: string) =>
      key === 'AUTOPILOT_ENABLED' ? opts.autopilotEnabled : undefined,
    ),
  };

  const userRepo = {
    findOne: jest.fn().mockResolvedValue({ id: 'user-1', email: 'a@b.c' }),
  };
  const siteRepo = {
    findOne: jest.fn().mockResolvedValue({ id: 'site-1', workspaceId: 'ws-1', name: 'Site' }),
  };
  const workspaceRepo = {
    findOne: jest.fn().mockResolvedValue({ id: 'ws-1', ownerId: 'user-1' }),
  };

  const unsplash = {
    searchPhotos: jest.fn().mockResolvedValue([
      {
        id: 'photo-1',
        urls: {
          regular: 'https://images.example/photo.jpg',
          full: 'https://images.example/full.jpg',
        },
        user: { name: 'Ada', links: { html: 'https://unsplash.example/@ada' } },
        links: { html: 'https://unsplash.example/photo-1' },
      },
    ]),
    triggerDownload: jest.fn().mockResolvedValue(undefined),
  };

  const service = new AutopilotService(
    configService as any,
    postsService as any,
    planner as any,
    unsplash as any,
    configRepo as any,
    topicRepo as any,
    postRepo as any,
    siteRepo as any,
    userRepo as any,
    workspaceRepo as any,
  );

  return { service, configRepo, topicRepo, postRepo, postsService, planner, unsplash };
}

describe('autopilot spend limits', () => {
  it('starts an article when the cadence is due', async () => {
    const h = harness();
    const result = await h.service.runDue(new Date('2026-03-10T09:00:00Z'));

    expect(result.started).toBe(1);
    expect(h.postsService.generate).toHaveBeenCalledTimes(1);
  });

  it('refuses to exceed the monthly cap', async () => {
    const h = harness({
      configs: [makeConfig({ postsThisMonth: 10, maxPostsPerMonth: 10, monthAnchor: '2026-03' })],
    });

    const result = await h.service.runDue(new Date('2026-03-10T09:00:00Z'));

    expect(result.started).toBe(0);
    expect(h.postsService.generate).not.toHaveBeenCalled();
  });

  it('resets the counter when the month rolls over', async () => {
    // Without the rollover a config that once hit its ceiling would stay capped
    // forever — the cap would become permanent rather than monthly.
    const h = harness({
      configs: [makeConfig({ postsThisMonth: 10, maxPostsPerMonth: 10, monthAnchor: '2026-02' })],
    });

    const result = await h.service.runDue(new Date('2026-03-01T09:00:00Z'));

    expect(result.started).toBe(1);
    expect(h.configRepo.update).toHaveBeenCalledWith(
      { id: 'cfg-1' },
      expect.objectContaining({ monthAnchor: '2026-03', postsThisMonth: 0 }),
    );
  });

  it('respects the global kill switch', async () => {
    const h = harness({ autopilotEnabled: 'false' });
    const result = await h.service.runDue();

    expect(result.started).toBe(0);
    expect(h.configRepo.find).not.toHaveBeenCalled();
  });

  it('skips a config whose cadence has not elapsed', async () => {
    const now = new Date('2026-03-10T09:00:00Z');
    const h = harness({
      // 1/week, ran yesterday → not due for another six days.
      configs: [makeConfig({ postsPerWeek: 1, lastRunAt: new Date('2026-03-09T09:00:00Z') })],
    });

    const result = await h.service.runDue(now);

    expect(result.started).toBe(0);
    expect(h.postsService.generate).not.toHaveBeenCalled();
  });
});

describe('autopilot double-run protection', () => {
  it('does not generate when another process already claimed the run', async () => {
    // Both the API and the worker host this cron. The loser of the claim must
    // do nothing at all, or every article would be generated (and billed) twice.
    const h = harness({ claimAffected: 0 });

    const result = await h.service.runDue(new Date('2026-03-10T09:00:00Z'));

    expect(result.started).toBe(0);
    expect(h.postsService.generate).not.toHaveBeenCalled();
  });
});

describe('autopilot topic consumption', () => {
  it('does not consume the topic when generation is refused for quota', async () => {
    const generate = jest
      .fn()
      .mockRejectedValue(new ForbiddenException('Token bakiyeniz yetersiz.'));
    const h = harness({ generateImpl: generate, topic: makeTopic({ attempts: 0 }) });

    const result = await h.service.runDue(new Date('2026-03-10T09:00:00Z'));

    expect(result.started).toBe(0);
    // Left planned so the next tick retries it — a billing error must not burn
    // a topic the customer never got an article for.
    expect(h.topicRepo.update).toHaveBeenCalledWith(
      { id: 'topic-1' },
      expect.objectContaining({ status: TopicIdeaStatus.PLANNED, attempts: 1 }),
    );
    expect(h.configRepo.increment).not.toHaveBeenCalled();
  });

  it('sets a topic aside after repeated enqueue failures', async () => {
    const generate = jest.fn().mockRejectedValue(new Error('provider down'));
    const h = harness({ generateImpl: generate, topic: makeTopic({ attempts: 2 }) });

    await h.service.runDue(new Date('2026-03-10T09:00:00Z'));

    // One poison topic must not stall the queue behind it forever.
    expect(h.topicRepo.update).toHaveBeenCalledWith(
      { id: 'topic-1' },
      expect.objectContaining({ status: TopicIdeaStatus.REJECTED, attempts: 3 }),
    );
  });

  it('marks the topic used and counts it once generation is enqueued', async () => {
    const h = harness();

    await h.service.runDue(new Date('2026-03-10T09:00:00Z'));

    expect(h.topicRepo.update).toHaveBeenCalledWith(
      { id: 'topic-1', status: TopicIdeaStatus.PLANNED },
      expect.objectContaining({ status: TopicIdeaStatus.USED, postId: 'post-1' }),
    );
    expect(h.configRepo.increment).toHaveBeenCalledWith({ id: 'cfg-1' }, 'postsThisMonth', 1);
  });

  it('refills the topic queue before taking from it', async () => {
    const h = harness({ plannedCount: 2 });

    await h.service.runDue(new Date('2026-03-10T09:00:00Z'));

    expect(h.planner.planBatch).toHaveBeenCalled();
  });

  it('does not plan when the queue is still full', async () => {
    const h = harness({ plannedCount: 20 });

    await h.service.runDue(new Date('2026-03-10T09:00:00Z'));

    expect(h.planner.planBatch).not.toHaveBeenCalled();
  });

  it('starts nothing when no topic is available', async () => {
    const h = harness({ topic: null, plannedCount: 20 });

    const result = await h.service.runDue(new Date('2026-03-10T09:00:00Z'));

    expect(result.started).toBe(0);
    expect(h.postsService.generate).not.toHaveBeenCalled();
  });
});

describe('autopilot publishing', () => {
  it('only promotes posts that finished generating', async () => {
    const h = harness({ configs: [makeConfig({ autoPublish: true })] });
    h.topicRepo.find.mockResolvedValue([
      makeTopic({ status: TopicIdeaStatus.USED, postId: 'post-1' }),
    ]);

    const result = await h.service.publishReadyPosts(new Date('2026-03-10T09:05:00Z'));

    expect(result.scheduled).toBe(1);
    // The claim is conditional on DRAFT, so a post still QUEUED or GENERATING —
    // or one that FAILED — is never published.
    expect(h.postRepo.createQueryBuilder).toHaveBeenCalled();
  });

  it('does nothing when no config has auto-publish on', async () => {
    const h = harness({ configs: [] });
    h.configRepo.find.mockResolvedValue([]);

    const result = await h.service.publishReadyPosts();

    expect(result.scheduled).toBe(0);
    expect(h.postRepo.createQueryBuilder).not.toHaveBeenCalled();
  });
});

describe('autopilot cover images', () => {
  it('attaches a cover image searched on the planner keyword', async () => {
    const h = harness({ topic: makeTopic({ primaryKeyword: 'içerik kümesi' }) });

    await h.service.runDue(new Date('2026-03-10T09:00:00Z'));

    // Searched on primaryKeyword, not the title — the keyword is what the
    // planner picked for retrieval, and using it costs no model call.
    expect(h.unsplash.searchPhotos).toHaveBeenCalledWith('içerik kümesi', 1, 1);

    const dto = h.postsService.generate.mock.calls[0][1];
    expect(dto.coverImageUrl).toBe('https://images.example/photo.jpg');
    expect(JSON.parse(dto.coverImageCreditJson)).toEqual({
      name: 'Ada',
      photographerUrl: 'https://unsplash.example/@ada',
      photoUrl: 'https://unsplash.example/photo-1',
    });
  });

  it('still generates when Unsplash is unavailable', async () => {
    // searchPhotos throws outright when UNSPLASH_ACCESS_KEY is unset. An
    // install without that key must keep publishing, just without pictures.
    const h = harness();
    h.unsplash.searchPhotos.mockRejectedValue(new Error('Unsplash API key not configured'));

    const result = await h.service.runDue(new Date('2026-03-10T09:00:00Z'));

    expect(result.started).toBe(1);
    const dto = h.postsService.generate.mock.calls[0][1];
    expect(dto.coverImageUrl).toBeUndefined();
  });
});

/**
 * Partner-API authorization.
 *
 * An API key carries an organization + project, never a user, so the dashboard's
 * "do you own this workspace" check does not apply. The bridge is convention —
 * `project.slug` holds the workspace id — and a slug is attacker-influenced
 * input, so these assert that it is verified rather than trusted. A hole here
 * lets one customer's key configure another's autopilot.
 */
const WS_A = '11111111-1111-4111-8111-111111111111';
const WS_B = '22222222-2222-4222-8222-222222222222';

const ORG_ID = 'org-1';
const OWNER = 'owner-1';

/** The organization an API key authenticated as. */
function org(overrides: Partial<{ id: string; ownerId: string }> = {}) {
  return { id: ORG_ID, ownerId: OWNER, ...overrides } as any;
}

/** The project that key is scoped to. `slug` carries the workspace id. */
function proj(slug: string, organizationId = ORG_ID) {
  return { slug, organizationId } as any;
}

function apiHarness(
  opts: {
    siteWorkspaceId?: string;
    /** workspace id -> owning user. A workspace absent here does not exist. */
    workspaceOwners?: Record<string, string | null>;
  } = {},
) {
  const owners: Record<string, string | null> = opts.workspaceOwners ?? {
    [WS_A]: OWNER,
    [WS_B]: OWNER,
  };

  const siteRepo = {
    findOne: jest.fn().mockResolvedValue({
      id: 'site-1',
      workspaceId: opts.siteWorkspaceId ?? WS_A,
      name: 'Site',
    }),
    find: jest.fn().mockResolvedValue([]),
    create: jest.fn((v: any) => v),
    save: jest.fn((v: any) => Promise.resolve({ id: 'site-new', ...v })),
  };
  const workspaceRepo = {
    // Stands in for the `workspaces` lookup: only ids present in `owners` exist,
    // and each carries whichever user owns it.
    findOne: jest.fn(({ where }: any) =>
      Promise.resolve(where.id in owners ? { id: where.id, ownerId: owners[where.id] } : null),
    ),
  };
  const configRepo = {
    findOne: jest.fn().mockResolvedValue(null),
    create: jest.fn((v: any) => v),
    save: jest.fn((v: any) => Promise.resolve({ id: 'cfg-new', ...v })),
    find: jest.fn().mockResolvedValue([]),
    update: jest.fn().mockResolvedValue({ affected: 1 }),
  };

  const service = new AutopilotService(
    { get: jest.fn() } as any,
    { generate: jest.fn() } as any,
    { plannedCount: jest.fn(), planBatch: jest.fn().mockResolvedValue(5) } as any,
    { searchPhotos: jest.fn(), triggerDownload: jest.fn() } as any,
    configRepo as any,
    { findOne: jest.fn(), find: jest.fn().mockResolvedValue([]), update: jest.fn() } as any,
    { createQueryBuilder: jest.fn() } as any,
    siteRepo as any,
    { findOne: jest.fn() } as any,
    workspaceRepo as any,
  );

  return { service, siteRepo, workspaceRepo, configRepo };
}

describe('partner-API autopilot authorization', () => {
  it('allows a key whose project bridges to the site’s workspace', async () => {
    const h = apiHarness({ siteWorkspaceId: WS_A });

    await expect(h.service.getConfigForProject('site-1', proj(WS_A), org())).resolves.toBeNull();
  });

  it('refuses a site that belongs to another tenant', async () => {
    // The whole point: key for workspace B, site in workspace A.
    const h = apiHarness({ siteWorkspaceId: WS_A });

    await expect(h.service.getConfigForProject('site-1', proj(WS_B), org())).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('refuses to write another tenant’s configuration', async () => {
    const h = apiHarness({ siteWorkspaceId: WS_A });

    await expect(
      h.service.upsertConfigForProject('site-1', proj(WS_B), org(), { enabled: true }),
    ).rejects.toThrow(ForbiddenException);
    expect(h.configRepo.save).not.toHaveBeenCalled();
  });

  it('refuses a slug that is not a uuid instead of querying with it', async () => {
    const h = apiHarness({ siteWorkspaceId: WS_A });

    await expect(
      h.service.getConfigForProject('site-1', proj('not-a-uuid'), org()),
    ).rejects.toThrow(ForbiddenException);
    // Shape-checked before it ever reaches the database.
    expect(h.workspaceRepo.findOne).not.toHaveBeenCalled();
  });

  it('refuses a slug that matches no workspace', async () => {
    // A project created outside the naming convention must deny, not fall back
    // to some "default" site.
    const h = apiHarness({ siteWorkspaceId: WS_A, workspaceOwners: {} });

    await expect(h.service.getConfigForProject('site-1', proj(WS_A), org())).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('bills a key-created config to the workspace owner, not the key', async () => {
    const h = apiHarness({ siteWorkspaceId: WS_A });

    await h.service.upsertConfigForProject('site-1', proj(WS_A), org(), { enabled: true });

    expect(h.configRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'owner-1', workspaceId: WS_A }),
    );
  });

  it('lists only the calling project’s sites', async () => {
    const h = apiHarness();

    await h.service.listSitesForProject(proj(WS_A), org());

    expect(h.siteRepo.find).toHaveBeenCalledWith(
      expect.objectContaining({ where: { workspaceId: WS_A } }),
    );
  });

  it('returns no sites for a project that bridges to nothing', async () => {
    const h = apiHarness({ workspaceOwners: {} });

    await expect(h.service.listSitesForProject(proj(WS_A), org())).resolves.toEqual([]);
    expect(h.siteRepo.find).not.toHaveBeenCalled();
  });

  it('refuses to create a site for a project that bridges to nothing', async () => {
    const h = apiHarness({ workspaceOwners: {} });

    await expect(
      h.service.createSiteForProject(proj(WS_A), org(), { name: 'Yeni' }),
    ).rejects.toThrow(ForbiddenException);
    expect(h.siteRepo.save).not.toHaveBeenCalled();
  });
});

/**
 * Tenancy is bound to the key's owner, not to the slug.
 *
 * Checking only that `project.slug` names *some* existing workspace would rest
 * the whole boundary on an invariant maintained in three other files. Today
 * every project is created with `slug = workspace.id` for a workspace the caller
 * owns, so the weaker check happened to be safe — but nothing in this module
 * enforced it, and a future project endpoint accepting a caller-supplied slug
 * would turn that into a silent cross-tenant read. These pin the stronger rule.
 */
describe('partner-API tenancy is owner-bound', () => {
  const OTHER_OWNER = 'owner-2';

  it('refuses a workspace owned by someone else, even though the slug is real', async () => {
    // The exact IDOR: a valid uuid naming a workspace that exists — but belongs
    // to another customer.
    const h = apiHarness({
      siteWorkspaceId: WS_B,
      workspaceOwners: { [WS_B]: OTHER_OWNER },
    });

    await expect(h.service.getConfigForProject('site-1', proj(WS_B), org())).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('refuses to write to a workspace owned by someone else', async () => {
    const h = apiHarness({
      siteWorkspaceId: WS_B,
      workspaceOwners: { [WS_B]: OTHER_OWNER },
    });

    await expect(
      h.service.upsertConfigForProject('site-1', proj(WS_B), org(), { enabled: true }),
    ).rejects.toThrow(ForbiddenException);
    expect(h.configRepo.save).not.toHaveBeenCalled();
  });

  it('lists nothing when the workspace belongs to another owner', async () => {
    const h = apiHarness({ workspaceOwners: { [WS_A]: OTHER_OWNER } });

    await expect(h.service.listSitesForProject(proj(WS_A), org())).resolves.toEqual([]);
    expect(h.siteRepo.find).not.toHaveBeenCalled();
  });

  it('refuses a project that does not belong to the authenticated organization', async () => {
    // The guard loads both from one key record, so a mismatch means the pair was
    // assembled somewhere it should not have been.
    const h = apiHarness({ siteWorkspaceId: WS_A });

    await expect(
      h.service.getConfigForProject('site-1', proj(WS_A, 'org-other'), org()),
    ).rejects.toThrow(ForbiddenException);
  });

  it('fails closed when the organization carries no owner', async () => {
    const h = apiHarness({ siteWorkspaceId: WS_A });

    await expect(
      h.service.getConfigForProject('site-1', proj(WS_A), org({ ownerId: undefined as any })),
    ).rejects.toThrow(ForbiddenException);
  });

  it('fails closed when the workspace carries no owner', async () => {
    const h = apiHarness({
      siteWorkspaceId: WS_A,
      workspaceOwners: { [WS_A]: null },
    });

    await expect(h.service.getConfigForProject('site-1', proj(WS_A), org())).rejects.toThrow(
      ForbiddenException,
    );
  });
});

describe('buildContext', () => {
  it('carries the angle, keyword and niche when no promotion is set', () => {
    const ctx = buildContext(makeTopic(), makeConfig({ niche: 'oto servis' }));
    expect(ctx).toBe('Bir açı Hedef anahtar kelime: test. Sitenin alanı: oto servis.');
    expect(ctx).not.toContain('Tanıtılacak ürün');
  });

  it('appends the promotion brief and asks for a CTA', () => {
    const ctx = buildContext(
      makeTopic(),
      makeConfig({ promotion: 'OtoGarajim — otogarajim.com, ücretsiz deneyin.' }),
    )!;
    expect(ctx.startsWith('Bir açı')).toBe(true);
    expect(ctx).toContain('Tanıtılacak ürün: OtoGarajim — otogarajim.com, ücretsiz deneyin.');
    expect(ctx).toContain('sonuç bölümünü');
  });

  it('truncates the angle, never the promotion, to stay within 1000 characters', () => {
    const promotion = 'P'.repeat(600);
    const ctx = buildContext(makeTopic({ angle: 'A'.repeat(2000) }), makeConfig({ promotion }))!;
    expect(ctx.length).toBeLessThanOrEqual(1000);
    expect(ctx).toContain(promotion);
    expect(ctx).toContain('reklam metnine dönüşmesin.');
  });

  it('ignores a whitespace-only promotion', () => {
    expect(buildContext(makeTopic(), makeConfig({ promotion: '   ' }))).not.toContain(
      'Tanıtılacak',
    );
  });
});
