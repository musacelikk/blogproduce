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
import { Project } from '../entities/project.entity';
import { PostsService } from '../posts/posts.service';
import { UnsplashService } from '../unsplash/unsplash.service';
import { normalizeTier } from '../billing/model-tiers';
import { TopicPlannerService, REFILL_THRESHOLD } from './topic-planner.service';
import { UpsertAutopilotConfigDto } from './dto/upsert-autopilot-config.dto';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/** Shape check before a slug is used as a workspace id. */
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
    private readonly unsplash: UnsplashService,
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

  // ---------------------------------------------------------------- dashboard
  // JWT principal: the signed-in user must own the site's workspace.

  async getConfig(siteId: string, user: User): Promise<AutopilotConfig | null> {
    const site = await this.assertSiteOwner(siteId, user);
    return this.readConfig(site);
  }

  async upsertConfig(
    siteId: string,
    user: User,
    dto: UpsertAutopilotConfigDto,
  ): Promise<AutopilotConfig> {
    const site = await this.assertSiteOwner(siteId, user);
    return this.writeConfig(site, dto);
  }

  // -------------------------------------------------------------- partner API
  // API-key principal: there is no user, only an organization + project. The
  // site must belong to the workspace that project is bridged to, or one
  // customer's key could configure another customer's autopilot.

  async getConfigForProject(siteId: string, project: Project): Promise<AutopilotConfig | null> {
    const site = await this.assertSiteInProject(siteId, project);
    return this.readConfig(site);
  }

  async upsertConfigForProject(
    siteId: string,
    project: Project,
    dto: UpsertAutopilotConfigDto,
  ): Promise<AutopilotConfig> {
    const site = await this.assertSiteInProject(siteId, project);
    return this.writeConfig(site, dto);
  }

  async listTopicsForProject(siteId: string, project: Project): Promise<TopicIdea[]> {
    const site = await this.assertSiteInProject(siteId, project);
    return this.readTopics(site);
  }

  async planTopicsNowForProject(siteId: string, project: Project): Promise<{ added: number }> {
    const site = await this.assertSiteInProject(siteId, project);
    return this.planFor(site);
  }

  /** The sites an API key may drive, so a caller can discover ids to configure. */
  async listSitesForProject(project: Project): Promise<Site[]> {
    const workspaceId = await this.resolveWorkspaceId(project);
    if (!workspaceId) return [];
    return this.siteRepository.find({
      where: { workspaceId },
      order: { createdAt: 'ASC' },
    });
  }

  async createSiteForProject(
    project: Project,
    input: { name: string; domain?: string; description?: string },
  ): Promise<Site> {
    const workspaceId = await this.resolveWorkspaceId(project);
    if (!workspaceId) {
      throw new ForbiddenException(
        'Bu API anahtarı bir workspace ile eşleşmiyor. Panelden bir site oluşturun.',
      );
    }
    const site = this.siteRepository.create({
      name: input.name,
      domain: input.domain,
      description: input.description,
      workspaceId,
    });
    return this.siteRepository.save(site);
  }

  // ------------------------------------------------------------------- shared

  private async readConfig(site: Site): Promise<AutopilotConfig | null> {
    return this.configRepository.findOne({ where: { siteId: site.id } });
  }

  private async writeConfig(site: Site, dto: UpsertAutopilotConfigDto): Promise<AutopilotConfig> {
    const siteId = site.id;

    let config = await this.configRepository.findOne({ where: { siteId } });
    if (!config) {
      // Billing always follows the workspace owner, whichever principal is
      // writing — an API key is issued by that owner and spends their plan.
      const workspace = await this.workspaceRepository.findOne({
        where: { id: site.workspaceId },
      });
      if (!workspace) throw new NotFoundException('Workspace bulunamadı.');

      config = this.configRepository.create({
        siteId,
        workspaceId: site.workspaceId,
        userId: workspace.ownerId,
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
    const site = await this.assertSiteOwner(siteId, user);
    return this.readTopics(site);
  }

  /** Plan topics now rather than waiting for a run to notice the queue is low. */
  async planTopicsNow(siteId: string, user: User): Promise<{ added: number }> {
    const site = await this.assertSiteOwner(siteId, user);
    return this.planFor(site);
  }

  private async readTopics(site: Site): Promise<TopicIdea[]> {
    const config = await this.configRepository.findOne({ where: { siteId: site.id } });
    if (!config) return [];

    return this.topicRepository.find({
      where: { configId: config.id },
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }

  private async planFor(site: Site): Promise<{ added: number }> {
    const config = await this.configRepository.findOne({ where: { siteId: site.id } });
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

    const cover = await this.findCoverImage(topic);

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
        ...(cover ? { coverImageUrl: cover.url, coverImageCreditJson: cover.creditJson } : {}),
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

  /**
   * A cover image for a planned topic, or null.
   *
   * Searched with the topic planner's own `primaryKeyword`, which is why this
   * costs nothing: the alternative, `SeoService.findCoverImage`, spent a
   * gpt-4o-mini call deriving a search phrase we already have.
   *
   * Never fatal. `searchPhotos` throws outright when `UNSPLASH_ACCESS_KEY` is
   * unset, and an install without that key must still publish articles — just
   * without pictures.
   */
  private async findCoverImage(
    topic: TopicIdea,
  ): Promise<{ url: string; creditJson: string } | null> {
    const query = (topic.primaryKeyword || topic.title || '').trim();
    if (!query) return null;

    try {
      const photos = await this.unsplash.searchPhotos(query, 1, 1);
      const photo = photos?.[0];
      if (!photo) return null;

      // Unsplash's API guidelines require a download ping on use; it is
      // fire-and-forget because a failed ping must not cost us the image.
      this.unsplash.triggerDownload(photo.id).catch(() => undefined);

      return {
        url: photo.urls.regular || photo.urls.full,
        // posts.service parses this field, so it is handed over as a string.
        creditJson: JSON.stringify({
          name: photo.user.name,
          photographerUrl: photo.user.links.html,
          photoUrl: photo.links.html,
        }),
      };
    } catch (err) {
      this.logger.warn(`Kapak görseli bulunamadı ("${query}"): ${(err as Error).message}`);
      return null;
    }
  }

  private async note(config: AutopilotConfig, message: string): Promise<void> {
    this.logger.warn(`Otopilot (config ${config.id}): ${message}`);
    await this.configRepository.update({ id: config.id }, { lastError: message });
  }

  /**
   * The workspace an API key's project is bridged to.
   *
   * `project.slug` holds the workspace id by convention (see
   * `BlogService.getUserOrganizationAndProject`), but a slug is a plain string,
   * so it is shape-checked and then verified against `workspaces` rather than
   * trusted. A project created outside the convention resolves to null, which
   * denies rather than guessing.
   */
  private async resolveWorkspaceId(project: Project): Promise<string | null> {
    const slug = project?.slug;
    if (!slug || !UUID_PATTERN.test(slug)) return null;

    const workspace = await this.workspaceRepository.findOne({
      where: { id: slug },
      select: ['id'],
    });
    return workspace?.id ?? null;
  }

  /**
   * Authorizes an API-key caller for a site.
   *
   * This is the boundary that keeps one customer's key out of another's
   * autopilot: the site must live in the workspace the calling project is
   * bridged to. A project that resolves to no workspace is denied outright —
   * there is no "default" site to fall back on.
   */
  private async assertSiteInProject(siteId: string, project: Project): Promise<Site> {
    const site = await this.siteRepository.findOne({ where: { id: siteId } });
    if (!site) throw new NotFoundException('Site bulunamadı.');

    const workspaceId = await this.resolveWorkspaceId(project);
    if (!workspaceId || site.workspaceId !== workspaceId) {
      // Deliberately the same message as the dashboard's denial: whether a site
      // exists under another tenant is not this caller's business.
      throw new ForbiddenException('Bu siteye erişiminiz yok.');
    }
    return site;
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
