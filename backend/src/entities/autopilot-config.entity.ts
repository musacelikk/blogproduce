import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Site } from './site.entity';
import { Workspace } from './workspace.entity';

/**
 * Per-site autopilot settings: how often to publish, at what quality, and the
 * editorial context the topic planner reasons from.
 *
 * One row per site (`site_id` is unique). `enabled` defaults to **false** —
 * creating a config never starts spending money on its own.
 *
 * Tier and language are plain varchar rather than Postgres enums: tier→model is
 * env-overridable (`TIER_MODEL_*`), so pinning the set of accepted values into
 * the database would mean a migration every time the catalogue moves.
 * `normalizeTier()` validates on the way in.
 */
@Entity('autopilot_configs')
@Index(['enabled', 'lastRunAt'])
export class AutopilotConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'site_id', type: 'uuid', unique: true })
  siteId: string;

  @ManyToOne(() => Site, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'site_id' })
  site: Site;

  /**
   * Denormalised from the site so the run loop can scope posts and bill without
   * loading the site. A site never moves between workspaces.
   */
  @Column({ name: 'workspace_id', type: 'uuid' })
  workspaceId: string;

  @ManyToOne(() => Workspace, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workspace_id' })
  workspace: Workspace;

  /**
   * Who pays. Resolved from `workspace.owner_id` at creation and re-checked on
   * every run — generation goes through the normal billing gate as this user.
   */
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ type: 'boolean', default: false })
  enabled: boolean;

  // ---------------------------------------------------------------- cadence

  /** Articles per week. The run loop spaces them evenly (7 / postsPerWeek days). */
  @Column({ name: 'posts_per_week', type: 'int', default: 2 })
  postsPerWeek: number;

  /**
   * Hard ceiling per calendar month, independent of cadence. This is the
   * backstop that bounds spend when `postsPerWeek` is edited upwards or a month
   * happens to contain a fifth week.
   */
  @Column({ name: 'max_posts_per_month', type: 'int', default: 10 })
  maxPostsPerMonth: number;

  /** Posts enqueued in `month_anchor`. Reset when the anchor rolls over. */
  @Column({ name: 'posts_this_month', type: 'int', default: 0 })
  postsThisMonth: number;

  /** `YYYY-MM` the counter above belongs to. */
  @Column({ name: 'month_anchor', type: 'varchar', length: 7, nullable: true })
  monthAnchor: string | null;

  // ------------------------------------------------------------ generation

  /** Tier name (`standard` | `pro` | `premium`). Standard keeps autopilot cheap. */
  @Column({ type: 'varchar', length: 32, default: 'standard' })
  tier: string;

  @Column({ type: 'varchar', length: 8, default: 'tr' })
  language: string;

  @Column({ type: 'varchar', length: 100, default: 'professional' })
  tone: string;

  @Column({ type: 'varchar', length: 32, default: 'medium' })
  length: string;

  @Column({ name: 'seo_mode', type: 'boolean', default: true })
  seoMode: boolean;

  /**
   * When false (the default) finished articles stay `DRAFT` for review. When
   * true they are handed to the existing scheduled-publish path instead of
   * being published inline, so publication keeps its single atomic claim.
   */
  @Column({ name: 'auto_publish', type: 'boolean', default: false })
  autoPublish: boolean;

  // --------------------------------------------------------- site context
  // What the topic planner reasons from. This is the "understand the project"
  // half of autopilot: without it the planner only has the site name.

  @Column({ type: 'text', nullable: true })
  niche: string | null;

  @Column({ name: 'target_audience', type: 'text', nullable: true })
  targetAudience: string | null;

  /** Comma-separated seed keywords the planner should build coverage around. */
  @Column({ type: 'text', nullable: true })
  keywords: string | null;

  /** Comma-separated topics to stay away from (competitors, off-brand areas). */
  @Column({ name: 'excluded_topics', type: 'text', nullable: true })
  excludedTopics: string | null;

  // ------------------------------------------------------------ bookkeeping

  /**
   * Doubles as the run lock. The cron fires in both the API and worker
   * processes, so a run is claimed with a conditional UPDATE against this
   * column rather than read-then-write.
   */
  @Column({ name: 'last_run_at', type: 'timestamp', nullable: true })
  lastRunAt: Date | null;

  @Column({ name: 'topics_planned_at', type: 'timestamp', nullable: true })
  topicsPlannedAt: Date | null;

  @Column({ name: 'last_error', type: 'text', nullable: true })
  lastError: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
