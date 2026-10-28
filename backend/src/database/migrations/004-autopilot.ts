import { SchemaStatement } from '../schema-migrator.service';

/**
 * Autopilot: per-site publishing configuration and the planned topic queue.
 *
 * Both tables are new, so every statement is a plain `IF NOT EXISTS` create —
 * nothing here rewrites existing rows.
 *
 * Tier and language are varchar rather than Postgres enums on purpose.
 * Tier→model is overridable per environment (`TIER_MODEL_*`), so freezing the
 * accepted values into the schema would force a migration every time the model
 * catalogue moves; `normalizeTier()` validates on the way in instead.
 */
export const AUTOPILOT_004: SchemaStatement[] = [
  {
    // `site_id` is UNIQUE: autopilot is configured per site, and the run loop
    // relies on there being exactly one cadence per site to claim.
    sql: `CREATE TABLE IF NOT EXISTS autopilot_configs (
      id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      site_id              uuid NOT NULL UNIQUE REFERENCES sites (id) ON DELETE CASCADE,
      workspace_id         uuid NOT NULL REFERENCES workspaces (id) ON DELETE CASCADE,
      user_id              uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
      enabled              boolean NOT NULL DEFAULT false,
      posts_per_week       integer NOT NULL DEFAULT 2,
      max_posts_per_month  integer NOT NULL DEFAULT 10,
      posts_this_month     integer NOT NULL DEFAULT 0,
      month_anchor         varchar(7) NULL,
      tier                 varchar(32) NOT NULL DEFAULT 'standard',
      language             varchar(8) NOT NULL DEFAULT 'tr',
      tone                 varchar(100) NOT NULL DEFAULT 'professional',
      length               varchar(32) NOT NULL DEFAULT 'medium',
      seo_mode             boolean NOT NULL DEFAULT true,
      auto_publish         boolean NOT NULL DEFAULT false,
      niche                text NULL,
      target_audience      text NULL,
      keywords             text NULL,
      excluded_topics      text NULL,
      last_run_at          timestamp NULL,
      topics_planned_at    timestamp NULL,
      last_error           text NULL,
      created_at           timestamp NOT NULL DEFAULT now(),
      updated_at           timestamp NOT NULL DEFAULT now()
    )`,
  },
  {
    // The run loop's only scan: enabled configs ordered by when they last ran.
    sql: `CREATE INDEX IF NOT EXISTS idx_autopilot_enabled_last_run
          ON autopilot_configs (enabled, last_run_at)`,
    optional: true,
  },
  {
    sql: `CREATE TABLE IF NOT EXISTS topic_ideas (
      id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      config_id        uuid NOT NULL REFERENCES autopilot_configs (id) ON DELETE CASCADE,
      title            varchar(200) NOT NULL,
      slug             varchar(220) NOT NULL,
      angle            text NULL,
      primary_keyword  varchar(120) NULL,
      status           varchar(16) NOT NULL DEFAULT 'planned',
      post_id          uuid NULL REFERENCES posts (id) ON DELETE SET NULL,
      attempts         integer NOT NULL DEFAULT 0,
      used_at          timestamp NULL,
      created_at       timestamp NOT NULL DEFAULT now()
    )`,
  },
  {
    // "Next planned topic for this config" and "used topics awaiting publish"
    // are the two reads the run loop makes.
    sql: `CREATE INDEX IF NOT EXISTS idx_topic_ideas_config_status
          ON topic_ideas (config_id, status)`,
    optional: true,
  },
  {
    // Deduplication is enforced in the planner, but a unique index makes a
    // concurrent double-plan impossible rather than merely unlikely.
    sql: `CREATE UNIQUE INDEX IF NOT EXISTS idx_topic_ideas_config_slug
          ON topic_ideas (config_id, slug)`,
    optional: true,
  },
];
