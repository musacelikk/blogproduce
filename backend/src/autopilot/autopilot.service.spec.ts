import { ForbiddenException } from '@nestjs/common';
import { AutopilotService } from './autopilot.service';
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
