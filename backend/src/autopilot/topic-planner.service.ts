import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { LlmService } from '../ai/llm.service';
import { UsageService } from '../usage/usage.service';
import { AutopilotConfig } from '../entities/autopilot-config.entity';
import { TopicIdea, TopicIdeaStatus } from '../entities/topic-idea.entity';
import { Post } from '../entities/post.entity';
import { Site } from '../entities/site.entity';
import { toSlug } from '../common/utils/slug.util';
import { extractJson } from '../common/utils/json-extract.util';
import { buildTopicPlanPrompt } from './autopilot-prompts';
import { TOPIC_PLAN_JSON_SCHEMA, TOPIC_PLAN_SCHEMA_NAME, TopicPlan } from './topic-plan.schema';

/**
 * The model topic planning always runs on, regardless of the article tier the
 * config buys.
 *
 * This is the single most important cost decision in autopilot. Planning is a
 * short, highly structured task that `gpt-4o-mini` does well; a batch of 25
 * topics costs roughly $0.0014. Running the same call on the article tier would
 * multiply planning cost by ~17x for no measurable gain in topic quality, and
 * doing it per article instead of per batch would multiply it again by 25.
 */
const PLANNER_MODEL = 'gpt-4o-mini';

/** Topics per batch. One call amortised across this many articles. */
const BATCH_SIZE = 25;

/** Refill when the planned queue runs this low. */
export const REFILL_THRESHOLD = 5;

@Injectable()
export class TopicPlannerService {
  private readonly logger = new Logger(TopicPlannerService.name);

  constructor(
    private readonly llm: LlmService,
    private readonly usageService: UsageService,
    @InjectRepository(TopicIdea)
    private readonly topicRepository: Repository<TopicIdea>,
    @InjectRepository(AutopilotConfig)
    private readonly configRepository: Repository<AutopilotConfig>,
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @InjectRepository(Site)
    private readonly siteRepository: Repository<Site>,
  ) {}

  /** How many unused topics a config still has queued. */
  async plannedCount(configId: string): Promise<number> {
    return this.topicRepository.count({
      where: { configId, status: TopicIdeaStatus.PLANNED },
    });
  }

  /**
   * Plan a fresh batch of topics for a config and store the ones that are new.
   *
   * Returns the number of ideas actually inserted — zero is a normal outcome
   * when the model only produced duplicates of what the site already covers.
   */
  async planBatch(config: AutopilotConfig, count = BATCH_SIZE): Promise<number> {
    const site = await this.siteRepository.findOne({ where: { id: config.siteId } });

    // Everything the site has published or already has queued. Both are fed to
    // the planner as "already covered" and used to drop duplicates afterwards —
    // the prompt reduces collisions, it does not guarantee their absence.
    const existingTitles = await this.existingTitles(config);
    const taken = new Set(existingTitles.map((t) => toSlug(t)));

    const { system, user } = buildTopicPlanPrompt({
      siteName: site?.name ?? 'the site',
      siteDomain: site?.domain ?? null,
      siteDescription: site?.description ?? null,
      niche: config.niche,
      targetAudience: config.targetAudience,
      promotion: config.promotion,
      keywords: splitList(config.keywords),
      excludedTopics: splitList(config.excludedTopics),
      existingTitles,
      language: config.language,
      count,
    });

    const response = await this.llm.complete({
      model: PLANNER_MODEL,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      jsonSchema: { name: TOPIC_PLAN_SCHEMA_NAME, schema: TOPIC_PLAN_JSON_SCHEMA },
      maxTokens: 4000,
      temperature: 0.8,
    });

    // Planning is cheap but not free — it goes on the ledger like any other
    // spend, so the admin cost view stays truthful about where money went.
    await this.usageService
      .recordUsage(config.userId, response.model, response.tokensIn, response.tokensOut)
      .catch((err) => this.logger.warn(`Konu planlama kullanımı kaydedilemedi: ${err.message}`));

    const plan = extractJson<TopicPlan>(response.content);
    if (!plan?.topics?.length) {
      this.logger.warn(`Konu planı okunamadı (config ${config.id})`);
      return 0;
    }

    const rows: TopicIdea[] = [];
    for (const topic of plan.topics) {
      const title = (topic.title ?? '').trim();
      if (!title) continue;

      const slug = toSlug(title);
      // Guard against duplicates both against the site's history and within
      // this very batch — the model does occasionally repeat itself.
      if (!slug || taken.has(slug)) continue;
      taken.add(slug);

      rows.push(
        this.topicRepository.create({
          configId: config.id,
          title: title.slice(0, 200),
          slug: slug.slice(0, 220),
          angle: topic.angle?.trim() || null,
          primaryKeyword: topic.primaryKeyword?.trim()?.slice(0, 120) || null,
          status: TopicIdeaStatus.PLANNED,
        }),
      );
    }

    if (rows.length) {
      await this.topicRepository.save(rows);
    }

    await this.configRepository.update({ id: config.id }, { topicsPlannedAt: new Date() });

    this.logger.log(
      `Config ${config.id}: ${rows.length}/${plan.topics.length} yeni konu eklendi ` +
        `(${response.tokensIn}+${response.tokensOut} token)`,
    );

    return rows.length;
  }

  /**
   * Titles the site already has: every post in the workspace plus every topic
   * idea not yet rejected. Newest first, because that is what a fresh batch is
   * most likely to collide with.
   */
  private async existingTitles(config: AutopilotConfig): Promise<string[]> {
    const posts = await this.postRepository.find({
      where: { workspaceId: config.workspaceId },
      select: ['title'],
      order: { createdAt: 'DESC' },
      take: 300,
    });

    const ideas = await this.topicRepository.find({
      where: {
        configId: config.id,
        status: In([TopicIdeaStatus.PLANNED, TopicIdeaStatus.USED]),
      },
      select: ['title'],
      order: { createdAt: 'DESC' },
      take: 300,
    });

    const seen = new Set<string>();
    const titles: string[] = [];
    for (const title of [...ideas.map((i) => i.title), ...posts.map((p) => p.title)]) {
      const key = toSlug(title ?? '');
      if (!key || seen.has(key)) continue;
      seen.add(key);
      titles.push(title);
    }
    return titles;
  }
}

function splitList(value: string | null | undefined): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
}
