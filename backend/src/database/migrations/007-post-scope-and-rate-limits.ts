import { SchemaStatement } from '../schema-migrator.service';

/**
 * Repair the two defects behind the production errors of 2026-11-26.
 *
 * **1. Posts invisible to the partner API.** `PostsService.create()` — the
 * dashboard's own "new post" path — wrote `workspace_id` and nothing else, so
 * `/api/v1/published/:slug` (which filters on organization + project) answered
 * the customer's site with 404 for an article that existed and was published.
 * `create()` now populates both scopes; this backfills the rows that predate
 * the fix, bridging through the same convention the rest of the codebase uses:
 * the organization is named `<workspace> (<workspace id>)` and the project's
 * slug is the workspace id.
 *
 * This is migration 003 run in the opposite direction — that one reattached
 * API-created posts to their workspace, this one attaches dashboard-created
 * posts to their project.
 *
 * **2. Rate-limit counters.** The guard now moves its counter with
 * `INSERT … ON CONFLICT (api_key_id, window_start) DO UPDATE`, which needs a
 * unique index on exactly those columns. TypeORM's `@Index(unique: true)`
 * creates one — but only where `synchronize` has run, and `synchronize` is off
 * in production. The index is asserted here so the statement cannot fail at
 * runtime on an install that never had it.
 *
 * Every statement is idempotent: the backfills are guarded by `NOT EXISTS` and
 * `IS NULL`, so a re-run touches nothing.
 */
export const POST_SCOPE_AND_RATE_LIMITS_007: SchemaStatement[] = [
  {
    // gen_random_uuid() is core from Postgres 13; the extension covers older.
    sql: `CREATE EXTENSION IF NOT EXISTS pgcrypto`,
    optional: true,
  },
  {
    // An organization for every workspace that owns an unscoped post. Named
    // exactly as `createApiKey` and `PostsService.resolveOrgAndProject` name
    // it — a different spelling creates a second org and reads nothing.
    sql: `INSERT INTO organizations (id, name, description, owner_id, active, "createdAt", "updatedAt")
          SELECT gen_random_uuid(),
                 w.name || ' (' || w.id::text || ')',
                 COALESCE(w.description, 'Organization for ' || w.name),
                 w.owner_id,
                 true,
                 now(),
                 now()
          FROM workspaces w
          WHERE EXISTS (
                  SELECT 1 FROM posts p
                   WHERE p.workspace_id = w.id
                     AND (p.organization_id IS NULL OR p.project_id IS NULL)
                )
            AND NOT EXISTS (
                  SELECT 1 FROM organizations o
                   WHERE o.owner_id = w.owner_id
                     AND o.name = w.name || ' (' || w.id::text || ')'
                )`,
  },
  {
    // A project per workspace, slug = workspace id. `projects` is unique on
    // (organization_id, slug), so the NOT EXISTS is what keeps this re-runnable.
    sql: `INSERT INTO projects (id, organization_id, name, slug, description, active, "createdAt", "updatedAt")
          SELECT gen_random_uuid(),
                 o.id,
                 w.name,
                 w.id::text,
                 COALESCE(w.description, 'Project for workspace: ' || w.name),
                 true,
                 now(),
                 now()
          FROM workspaces w
          JOIN organizations o
            ON o.owner_id = w.owner_id
           AND o.name = w.name || ' (' || w.id::text || ')'
          WHERE EXISTS (
                  SELECT 1 FROM posts p
                   WHERE p.workspace_id = w.id
                     AND (p.organization_id IS NULL OR p.project_id IS NULL)
                )
            AND NOT EXISTS (
                  SELECT 1 FROM projects pr
                   WHERE pr.organization_id = o.id
                     AND pr.slug = w.id::text
                )`,
  },
  {
    // Attach the posts. A workspace can have ended up bridged to more than one
    // project (duplicate organizations predating the naming convention), so the
    // oldest is chosen deterministically rather than left to the planner — an
    // arbitrary pick would scatter one workspace's posts across two projects,
    // and the API reads one project at a time.
    sql: `UPDATE posts p
          SET organization_id = sub.organization_id,
              project_id = sub.project_id
          FROM (
            SELECT w.id AS workspace_id,
                   pr.organization_id,
                   pr.id AS project_id,
                   ROW_NUMBER() OVER (
                     PARTITION BY w.id ORDER BY pr."createdAt", pr.id
                   ) AS rn
            FROM workspaces w
            JOIN organizations o
              ON o.owner_id = w.owner_id
             AND o.name = w.name || ' (' || w.id::text || ')'
            JOIN projects pr
              ON pr.organization_id = o.id
             AND pr.slug = w.id::text
          ) sub
          WHERE sub.rn = 1
            AND p.workspace_id = sub.workspace_id
            AND (p.organization_id IS NULL OR p.project_id IS NULL)`,
  },
  {
    // The partner API's hot path: one project's published article by slug.
    sql: `CREATE INDEX IF NOT EXISTS idx_posts_project_slug
          ON posts (project_id, slug)`,
    optional: true,
  },
  {
    // Spent counter rows. Clearing them before asserting the unique index means
    // the index cannot fail on duplicates left by the old non-atomic path, and
    // costs nothing: a window older than two days is already unenforceable.
    sql: `DELETE FROM api_key_rate_limits
           WHERE date < (CURRENT_DATE - 2)`,
    optional: true,
  },
  {
    // Remaining duplicates for one (key, window) — the old code's INSERT race.
    // Counts are merged into the surviving row rather than discarded, so a key
    // mid-window keeps the allowance it has already spent.
    sql: `WITH merged AS (
            SELECT MIN(id::text)::uuid AS keep_id,
                   api_key_id,
                   window_start,
                   SUM(request_count) AS request_count,
                   SUM(generate_count) AS generate_count
            FROM api_key_rate_limits
            GROUP BY api_key_id, window_start
            HAVING COUNT(*) > 1
          )
          UPDATE api_key_rate_limits r
             SET request_count = merged.request_count,
                 generate_count = merged.generate_count
            FROM merged
           WHERE r.id = merged.keep_id`,
    optional: true,
  },
  {
    sql: `DELETE FROM api_key_rate_limits a
           USING api_key_rate_limits b
           WHERE a.api_key_id = b.api_key_id
             AND a.window_start = b.window_start
             AND a.id::text > b.id::text`,
    optional: true,
  },
  {
    // The arbiter for the guard's ON CONFLICT clause.
    sql: `CREATE UNIQUE INDEX IF NOT EXISTS idx_api_key_rate_limits_key_window
          ON api_key_rate_limits (api_key_id, window_start)`,
  },
  {
    // The daily allowance is a SUM over the day's rows.
    sql: `CREATE INDEX IF NOT EXISTS idx_api_key_rate_limits_key_date
          ON api_key_rate_limits (api_key_id, date)`,
    optional: true,
  },
];
