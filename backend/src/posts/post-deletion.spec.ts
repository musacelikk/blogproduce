import { Post } from '../entities/post.entity';
import { PostsService } from './posts.service';

/**
 * Deleting a post has to clear every table that points at it without a cascade,
 * or Postgres rejects the delete with a foreign-key violation. Three tables
 * qualify: generation_jobs, post_tags and usage_events.
 *
 * usage_events is the awkward one. It carries billing data (tokens, cost) and
 * its post_id is nullable precisely so a usage record can outlive the post it
 * describes — so the post reference must be dropped, not the row.
 */

const POST_ID = 'post-1';
const OTHER_POST_ID = 'post-2';

interface Row {
  post_id: string | null;
  [key: string]: unknown;
}

/**
 * Stands in for the schema: remembers which rows exist and refuses to delete a
 * post while a non-cascading table still references it, the way the real
 * foreign keys do.
 */
function makeFakeDb() {
  const tables: Record<string, Row[]> = {
    generation_jobs: [{ post_id: POST_ID }, { post_id: OTHER_POST_ID }],
    post_tags: [{ post_id: POST_ID, tag_id: 't1' }],
    usage_events: [
      { post_id: POST_ID, event_type: 'post.generated', tokens_used: 4200, cost: '0.13' },
      { post_id: POST_ID, event_type: 'post.published', tokens_used: null, cost: null },
      { post_id: OTHER_POST_ID, event_type: 'post.generated', tokens_used: 900, cost: '0.03' },
    ],
  };

  // post_id is NOT NULL on these, so nulling it out instead of deleting would
  // trade one constraint violation for another.
  const notNullPostId = new Set(['generation_jobs', 'post_tags']);
  const state = { tables, postDeleted: false };

  const manager = {
    createQueryBuilder() {
      let mode: 'delete' | 'update' | null = null;
      let table = '';
      let values: Record<string, unknown> = {};
      let postId: string | undefined;

      const qb = {
        delete() {
          mode = 'delete';
          return qb;
        },
        from(t: string) {
          table = t;
          return qb;
        },
        update(t: string) {
          mode = 'update';
          table = t;
          return qb;
        },
        set(v: Record<string, unknown>) {
          values = v;
          return qb;
        },
        where(_clause: string, params: { postId: string }) {
          postId = params.postId;
          return qb;
        },
        async execute() {
          const rows = state.tables[table] ?? [];
          if (mode === 'delete') {
            state.tables[table] = rows.filter((r) => r.post_id !== postId);
            return { affected: rows.length - state.tables[table].length };
          }
          if (notNullPostId.has(table) && 'post_id' in values && values.post_id === null) {
            throw new Error(`null value in column "post_id" of relation "${table}"`);
          }
          state.tables[table] = rows.map((r) =>
            r.post_id === postId ? { ...r, ...values } : r,
          );
          return { affected: rows.filter((r) => r.post_id === postId).length };
        },
      };
      return qb;
    },

    async remove(_entity: unknown, post: { id: string }) {
      const blocking = Object.entries(state.tables).find(([, rows]) =>
        rows.some((r) => r.post_id === post.id),
      );
      if (blocking) {
        throw new Error(
          `update or delete on table "posts" violates foreign key constraint on table "${blocking[0]}"`,
        );
      }
      state.postDeleted = true;
    },
  };

  return { state, manager };
}

function makeService(post: Partial<Post>, manager: unknown) {
  // Only two of the eleven injected dependencies matter for deletion, so the
  // prototype is used directly rather than standing up the whole Nest module.
  const service = Object.create(PostsService.prototype) as Record<string, unknown>;
  service.postsRepository = {
    findOne: async () => post,
    manager: {
      transaction: async (cb: (m: unknown) => Promise<void>) => cb(manager),
    },
  };
  service.logger = { warn: () => {}, log: () => {} };
  return service as unknown as PostsService;
}

describe('deleting a post', () => {
  it('removes a post that has usage events recorded against it', async () => {
    const { state, manager } = makeFakeDb();
    const service = makeService({ id: POST_ID, title: 'Test', workspaceId: 'w1' }, manager);

    await service.removeAsAdmin(POST_ID);

    expect(state.postDeleted).toBe(true);
  });

  it('keeps the billing history and only drops its link to the post', async () => {
    const { state, manager } = makeFakeDb();
    const service = makeService({ id: POST_ID, title: 'Test', workspaceId: 'w1' }, manager);

    await service.removeAsAdmin(POST_ID);

    const events = state.tables.usage_events;
    expect(events).toHaveLength(3);

    const orphaned = events.filter((e) => e.post_id === null);
    expect(orphaned).toHaveLength(2);
    expect(orphaned.map((e) => e.tokens_used)).toEqual([4200, null]);
    expect(orphaned.map((e) => e.cost)).toEqual(['0.13', null]);
  });

  it('leaves other posts alone', async () => {
    const { state, manager } = makeFakeDb();
    const service = makeService({ id: POST_ID, title: 'Test', workspaceId: 'w1' }, manager);

    await service.removeAsAdmin(POST_ID);

    expect(state.tables.usage_events.filter((e) => e.post_id === OTHER_POST_ID)).toHaveLength(1);
    expect(state.tables.generation_jobs).toEqual([{ post_id: OTHER_POST_ID }]);
  });

  it('deletes generation jobs rather than orphaning them', async () => {
    // post_id is NOT NULL there — nulling it would just move the error.
    const { state, manager } = makeFakeDb();
    const service = makeService({ id: POST_ID, title: 'Test', workspaceId: 'w1' }, manager);

    await service.removeAsAdmin(POST_ID);

    expect(state.tables.generation_jobs.some((r) => r.post_id === POST_ID)).toBe(false);
    expect(state.tables.post_tags).toHaveLength(0);
  });
});
