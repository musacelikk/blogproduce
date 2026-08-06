import { SchemaStatement } from '../schema-migrator.service';

/**
 * Reattach API-generated posts to their workspace.
 *
 * Posts created through the partner API were scoped only by
 * organization + project, leaving `workspace_id` null. The dashboard filters on
 * `workspace_id` alone, so those posts were invisible to the very user who
 * generated them — they existed, were billed for, and could not be managed.
 *
 * `api.service.ts` now sets the column at creation; this repairs the rows that
 * predate that fix, using the same bridge the rest of the codebase relies on:
 * `project.slug` holds the workspace id.
 *
 * Safe to re-run: `workspace_id IS NULL` means an already-linked post is never
 * touched, and the join simply finds nothing when a slug is not a workspace id.
 */
export const LINK_API_POSTS_003: SchemaStatement[] = [
  {
    // `posts.workspace_id` is uuid (TypeORM took the type from the Workspace
    // relation), while `projects.slug` is varchar — so the *join* casts to text
    // and the *assignment* stays uuid. Casting the assignment too fails with
    // "column is of type uuid but expression is of type text".
    sql: `UPDATE posts p
          SET workspace_id = w.id
          FROM projects pr
          JOIN workspaces w ON w.id::text = pr.slug
          WHERE p.project_id = pr.id
            AND p.workspace_id IS NULL`,
  },
  {
    // Fallback for posts whose project slug is not a workspace id: attribute
    // them to the author's own workspace when that is unambiguous (exactly one).
    // Without this, older projects created outside the naming convention stay
    // orphaned forever.
    sql: `UPDATE posts p
          SET workspace_id = sub.workspace_id
          FROM (
            SELECT w.owner_id, MIN(w.id::text)::uuid AS workspace_id
            FROM workspaces w
            GROUP BY w.owner_id
            HAVING COUNT(*) = 1
          ) sub
          WHERE p.workspace_id IS NULL
            AND p.organization_id IS NOT NULL
            AND p.author_id = sub.owner_id`,
  },
  {
    // The dashboard's hot path is "my workspaces' posts, newest first".
    sql: `CREATE INDEX IF NOT EXISTS idx_posts_workspace_created
          ON posts (workspace_id, "createdAt" DESC)`,
    optional: true,
  },
];
