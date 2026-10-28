import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, IsNull, Not } from 'typeorm';
import { AutopilotConfig } from '../entities/autopilot-config.entity';
import { TopicIdea, TopicIdeaStatus } from '../entities/topic-idea.entity';
import { Post, PostStatus, PostLanguage } from '../entities/post.entity';
import { Site } from '../entities/site.entity';
import { User } from '../entities/user.entity';
import { Workspace } from '../entities/workspace.entity';
import { PostsService } from '../posts/posts.service';
import { normalizeTier } from '../billing/model-tiers';
import { TopicPlannerService, REFILL_THRESHOLD } from './topic-planner.service';
import { UpsertAutopilotConfigDto } from './dto/upsert-autopilot-config.dto';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/** A topic that cannot be enqueued this many times is set aside, not retried forever. */
const MAX_ENQUEUE_ATTEMPTS = 3;

/** Bounds how much work one cron tick can start, whatever the number of configs. */
const MAX_CONFIGS_PER_TICK = 10;

@Injectable()
export class AutopilotService {
  private readonly logger = new Logger(AutopilotService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly postsService: PostsService,
    private readonly planner: TopicPlannerService,
    @InjectRepository(AutopilotConfig)
    private readonly configRepository: Repository<AutopilotConfig>,
    @InjectRepository(TopicIdea)
    private readonly topicRepository: Repository<TopicIdea>,
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @InjectRepository(Site)
    private readonly siteRepository: Repository<Site>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Workspace)
    private readonly workspaceRepository: Repository<Workspace>,
  ) {}

  /** Operator kill switch. Set AUTOPILOT_ENABLED=false to stop all runs at once. */
  private get globallyEnabled(): boolean {
    return this.configService.get<string>('AUTOPILOT_ENABLED') !== 'false';
  }

  // ------------------------------------------------------------------ config

  async getConfig(siteId: string, user: User): Promise<AutopilotConfig | null> {
    await this.assertSiteOwner(siteId, user);
    return this.configRepository.findOne({ where: { siteId } });
  }

  async upsertConfig(
    siteId: string,
    user: User,
    dto: UpsertAutopilotConfigDto,
  ): Promise<AutopilotConfig> {
    const site = await this.assertSiteOwner(siteId, user);

    let config = await this.configRepository.findOne({ where: { siteId } });
    if (!config) {
      config = this.configRepository.create({
        siteId,
        workspaceId: site.workspaceId,
        userId: user.id,
      });
    }

    if (dto.tier !== undefined) {
      const tier = normalizeTier(dto.tier);
      if (!tier) {
        throw new ForbiddenException('Geçersiz kalite seviyesi.');
      }
      config.tier = tier;
    }

    // Each field is applied only when present so a partial update cannot
    // silently reset the rest of the config to its defaults.
    if (dto.enabled !== undefined) config.enabled = dto.enabled;
    if (dto.postsPerWeek !== undefined) config.postsPerWeek = dto.postsPerWeek;
    if (dto.maxPostsPerMonth !== undefined) config.maxPostsPerMonth = dto.maxPostsPerMonth;
    if (dto.language !== undefined) config.language = dto.language;
    if (dto.tone !== undefined) config.tone = dto.tone;
    if (dto.length !== undefined) config.length = dto.length;
    if (dto.seoMode !== undefined) config.seoMode = dto.seoMode;
    if (dto.autoPublish !== undefined) config.autoPublish = dto.autoPublish;
    if (dto.niche !== undefined) config.niche = dto.niche;
    if (dto.targetAudience !== undefined) config.targetAudience = dto.targetAudience;
    if (dto.keywords !== undefined) config.keywords = dto.keywords;
    if (dto.excludedTopics !== undefined) config.excludedTopics = dto.excludedTopics;

    return this.configRepository.save(config);
  }

  async listTopics(siteId: string, user: User): Promise<TopicIdea[]> {
    await this.assertSiteOwner(siteId, user);
    const config = await this.configRepository.findOne({ where: { siteId } });
    if (!config) return [];

    return this.topicRepository.find({
      where: { configId: config.id },
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }

  /** Plan topics now rather than waiting for a run to notice the queue is low. */
  async planTopicsNow(siteId: string, user: User): Promise<{ added: number }> {
    await this.assertSiteOwner(siteId, user);
    const config = await this.configRepository.findOne({ where: { siteId } });
    if (!config) throw new NotFoundException('Otopilot ayarı bulunamadı.');

    const added = await this.planner.planBatch(config);
    return { added };
  }

  async rejectTopic(topicId: string, user: User): Promise<void> {
    const topic = await this.topicRepository.findOne({ where: { id: topicId } });
    if (!topic) throw new NotFoundException('Konu bulunamadı.');

    const config = await this.configRepository.findOne({ where: { id: topic.configId } });
    if (!config) throw new NotFoundException('Otopilot ayarı bulunamadı.');
    await this.assertSiteOwner(config.siteId, user);

    await this.topicRepository.update(
      { id: topicId, status: TopicIdeaStatus.PLANNED },
      { status: TopicIdeaStatus.REJECTED },
    );
  }

  // --------------------------------------------------------------- run loop

  /**
   * One tick: start an article for every config whose cadence is due.
   *
   * Called from the hourly cron, which fires in both the API and the worker
   * process — every config is therefore claimed with a conditional UPDATE
   * before any work happens.
   */
  async runDue(now = new Date()): Promise<{ started: number }> {
    if (!this.globallyEnabled) return { started: 0 };

    const candidates = await this.configRepository.find({
      where: { enabled: true },
      take: MAX_CONFIGS_PER_TICK * 4,
    });

    let started = 0;
    for (const config of candidates) {
      if (started >= MAX_CONFIGS_PER_TICK) break;

      const intervalMs = this.intervalFor(config);
      const dueBefore = new Date(now.getTime() - intervalMs);

      if (config.lastRunAt && config.lastRunAt > dueBefore) continue;

      // Claim. Only one process gets affected=1, so the article is started once.
      const claim = await this.configRepository
        .createQueryBuilder()
        .update(AutopilotConfig)
        .set({ lastRunAt: now })
        .where('id = :id', { id: config.id })
        .andWhere('enabled = true')
        .andWhere('(last_run_at IS NULL OR last_run_at <= :dueBefore)', { dueBefore })
        .execute();

      if ((claim.affected ?? 0) === 0) continue;

      try {
        const didStart = await this.runOne(config, now);
        if (didStart) started++;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        this.logger.error(`Otopilot çalışması başarısız (config ${config.id}): ${message}`);
        await this.configRepository.update({ id: config.id }, { lastError: message });
      }
    }

    return { started };
  }

  /**
   * Start one article for a claimed config.
   *
   * Returns false when nothing was started for an expected reason (monthly cap
   * reached, no topics available, quota exhausted) — those are logged on the
   * config rather than thrown.
   */
  private async runOne(config: AutopilotConfig, now: Date): Promise<boolean> {
    // Roll the monthly counter over before testing the cap, or a config stays
    // capped forever once it first hits the ceiling.
    const anchor = monthAnchor(now);
    if (config.monthAnchor !== anchor) {
      config.monthAnchor = anchor;
      config.postsThisMonth = 0;
      await this.configRepository.update(
        { id: config.id },
        { monthAnchor: anchor, postsThisMonth: 0 },
      );
    }

    if (config.postsThisMonth >= config.maxPostsPerMonth) {
      await this.note(config, `Aylık üretim limitine ulaşıldı (${config.maxPostsPerMonth}).`);
      return false;
    }

    // Refill the topic queue before taking from it, so a run is never skipped
    // just because the queue happened to empty.
    const planned = await this.planner.plannedCount(config.id);
    if (planned <= REFILL_THRESHOLD) {
      await this.planner
        .planBatch(config)
        .catch((err) =>
          this.logger.warn(`Konu planlanamadı (config ${config.id}): ${err.message}`),
        );
    }

    const topic = await this.topicRepository.findOne({
      where: { configId: config.id, status: TopicIdeaStatus.PLANNED },
      order: { createdAt: 'ASC' },
    });

    if (!topic) {
      await this.note(config, 'Planlanmış konu kalmadı.');
      return false;
    }

    const owner = await this.userRepository.findOne({ where: { id: config.userId } });
    if (!owner) {
      await this.note(config, 'Otopilot sahibi kullanıcı bulunamadı.');
      return false;
    }

    try {
      const result = await this.postsService.generate(owner, {
        workspaceId: config.workspaceId,
        topic: topic.title,
        language: (config.language as PostLanguage) || PostLanguage.TR,
        tone: config.tone,
        length: config.length,
        seoMode: config.seoMode,
        model: config.tier,
        targetAudience: config.targetAudience ?? undefined,
        additionalContext: buildContext(topic, config),
      });

      await this.topicRepository.update(
        { id: topic.id, status: TopicIdeaStatus.PLANNED },
        { status: TopicIdeaStatus.USED, postId: result.postId, usedAt: now },
      );

      await this.configRepository.increment({ id: config.id }, 'postsThisMonth', 1);
      await this.configRepository.update({ id: config.id }, { lastError: null });

      this.logger.log(
        `Otopilot: "${topic.title}" üretime alındı (config ${config.id}, post ${result.postId})`,
      );
      return true;
    } catch (err) {
      // The topic is NOT consumed on failure — a quota error must not silently
      // burn a planned topic. It is retried on the next tick, and set aside
      // only after repeated failures so one bad topic cannot stall the queue.
      const attempts = topic.attempts + 1;
      const message = err instanceof Error ? err.message : String(err);

      await this.topicRepository.update(
        { id: topic.id },
        {
          attempts,
          status:
            attempts >= MAX_ENQUEUE_ATTEMPTS ? TopicIdeaStatus.REJECTED : TopicIdeaStatus.PLANNED,
        },
      );

      await this.note(config, message);
      return false;
    }
  }

  /**
   * Hand finished autopilot articles to the scheduled-publish path.
   *
   * Publication is deliberately not done here: `publishScheduledPosts` already
   * claims each post atomically and fires the `post.published` webhook. Marking
   * the post `SCHEDULED` reuses that, instead of adding a second publish path
   * that would have to repeat the same guarantees.
   */
  async publishReadyPosts(now = new Date()): Promise<{ scheduled: number }> {
    if (!this.globallyEnabled) return { scheduled: 0 };

    const autoConfigs = await this.configRepository.find({
      where: { autoPublish: true, enabled: true },
      select: ['id'],
    });
    if (!autoConfigs.length) return { scheduled: 0 };

    const used = await this.topicRepository.find({
      where: {
        configId: In(autoConfigs.map((c) => c.id)),
        status: TopicIdeaStatus.USED,
        postId: Not(IsNull()),
      },
      order: { usedAt: 'ASC' },
      take: 50,
    });
    if (!used.length) return { scheduled: 0 };

    let scheduled = 0;
    for (const topic of used) {
      // Only a post the worker has finished (DRAFT) is eligible. QUEUED or
      // GENERATING means generation is still in flight; FAILED stays untouched.
      const claim = await this.postRepository
        .createQueryBuilder()
        .update(Post)
        .set({ status: PostStatus.SCHEDULED, scheduledAt: now })
        .where('id = :id', { id: topic.postId })
        .andWhere('status = :draft', { draft: PostStatus.DRAFT })
        .execute();

      if ((claim.affected ?? 0) > 0) scheduled++;
    }

    if (scheduled) {
      this.logger.log(`Otopilot: ${scheduled} makale yayına alındı.`);
    }
    return { scheduled };
  }

  // ----------------------------------------------------------------- helpers

  /** Even spacing derived from the weekly target. 2/week → every 3.5 days. */
  private intervalFor(config: AutopilotConfig): number {
    const perWeek = Math.max(1, Math.min(config.postsPerWeek || 1, 14));
    return Math.floor(WEEK_MS / perWeek);
  }

  private async note(config: AutopilotConfig, message: string): Promise<void> {
    this.logger.warn(`Otopilot (config ${config.id}): ${message}`);
    await this.configRepository.update({ id: config.id }, { lastError: message });
  }

  private async assertSiteOwner(siteId: string, user: User): Promise<Site> {
    const site = await this.siteRepository.findOne({ where: { id: siteId } });
    if (!site) throw new NotFoundException('Site bulunamadı.');

    const workspace = await this.workspaceRepository.findOne({
      where: { id: site.workspaceId },
    });
    if (!workspace || workspace.ownerId !== user.id) {
      throw new ForbiddenException('Bu siteye erişiminiz yok.');
    }
    return site;
  }
}

function monthAnchor(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

/** Carries the planner's angle through to the writer so the article matches the plan. */
function buildContext(topic: TopicIdea, config: AutopilotConfig): string | undefined {
  const parts: string[] = [];
  if (topic.angle) parts.push(topic.angle);
  if (topic.primaryKeyword) parts.push(`Hedef anahtar kelime: ${topic.primaryKeyword}.`);
  if (config.niche) parts.push(`Sitenin alanı: ${config.niche}.`);
  const context = parts.join(' ').trim();
  // posts.service caps additionalContext at 1000 characters.
  return context ? context.slice(0, 1000) : undefined;
}
