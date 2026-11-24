import { PostsService } from './posts.service';
import { PostStatus } from '../entities/post.entity';

/**
 * The scheduled-publish cron must stay bounded.
 *
 * It used to load every due post with `relations: ['revisions']`, and a
 * revision row carries the whole article. With a backlog that pulled every
 * version of every due post into memory in one tick — all reachable, so GC
 * freed nothing — and production died with "JavaScript heap out of memory"
 * around a 250MB live set, before publishing anything.
 *
 * These assert the query shape rather than the outcome, because the outcome
 * (an OOM) is not something a unit test can wait for.
 */
function buildService(duePosts: any[] = []) {
  const findOptions: any[] = [];

  const chain: any = {
    update: () => chain,
    set: () => chain,
    where: () => chain,
    andWhere: () => chain,
    execute: jest.fn().mockResolvedValue({ affected: 1 }),
  };

  const postsRepository = {
    find: jest.fn((opts: any) => {
      findOptions.push(opts);
      return Promise.resolve(duePosts);
    }),
    createQueryBuilder: jest.fn(() => chain),
  };

  const postRevisionsRepository = {
    findOne: jest.fn().mockResolvedValue({ id: 'rev-9' }),
    find: jest.fn().mockResolvedValue([]),
  };

  const webhookService = { triggerWebhook: jest.fn().mockResolvedValue(undefined) };

  const service = new PostsService(
    postsRepository as any,
    {} as any, // workspaces
    {} as any, // tags
    postRevisionsRepository as any,
    {} as any, // generation jobs
    {} as any, // organizations
    {} as any, // projects
    {} as any, // sqs
    webhookService as any,
    {} as any, // billing
    {} as any, // html sanitizer
  );

  return { service, postsRepository, postRevisionsRepository, webhookService, findOptions };
}

describe('publishScheduledPosts query shape', () => {
  it('does not load the revisions relation', async () => {
    const h = buildService();

    await h.service.publishScheduledPosts();

    const [opts] = h.findOptions;
    // The loop reads plain columns only; a relation here is hundreds of MB of
    // article text fetched to be thrown away.
    expect(opts.relations ?? []).not.toContain('revisions');
    expect(opts.relations).toBeUndefined();
  });

  it('bounds the batch so one tick cannot load an unbounded backlog', async () => {
    const h = buildService();

    await h.service.publishScheduledPosts();

    const [opts] = h.findOptions;
    expect(typeof opts.take).toBe('number');
    expect(opts.take).toBeGreaterThan(0);
    expect(opts.take).toBeLessThanOrEqual(100);
  });

  it('selects only the columns the loop uses', async () => {
    const h = buildService();

    await h.service.publishScheduledPosts();

    const [opts] = h.findOptions;
    expect(opts.select).toEqual(
      expect.arrayContaining([
        'id',
        'title',
        'slug',
        'organizationId',
        'projectId',
        'publishedRevisionId',
      ]),
    );
  });

  it('takes the oldest due posts first, so a backlog drains in order', async () => {
    const h = buildService();

    await h.service.publishScheduledPosts();

    expect(h.findOptions[0].order).toEqual({ scheduledAt: 'ASC' });
  });
});

describe('publishScheduledPosts behaviour is unchanged', () => {
  const duePost = {
    id: 'post-1',
    title: 'Başlık',
    slug: 'baslik',
    organizationId: 'org-1',
    projectId: 'proj-1',
    publishedRevisionId: null,
    status: PostStatus.SCHEDULED,
  };

  it('resolves the revision id without loading article content', async () => {
    const h = buildService([{ ...duePost }]);

    await h.service.publishScheduledPosts();

    // One row, one column — not every revision of the post.
    expect(h.postRevisionsRepository.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ select: ['id'], order: { version: 'DESC' } }),
    );
    expect(h.postRevisionsRepository.find).not.toHaveBeenCalled();
  });

  it('still claims each post atomically and fires the webhook', async () => {
    const h = buildService([{ ...duePost }]);

    await h.service.publishScheduledPosts();

    expect(h.postsRepository.createQueryBuilder).toHaveBeenCalled();
    expect(h.webhookService.triggerWebhook).toHaveBeenCalledWith(
      'org-1',
      'proj-1',
      expect.anything(),
      expect.objectContaining({ postId: 'post-1' }),
    );
  });

  it('skips the webhook for a post with no organization scope', async () => {
    const h = buildService([{ ...duePost, organizationId: null, projectId: null }]);

    await h.service.publishScheduledPosts();

    expect(h.webhookService.triggerWebhook).not.toHaveBeenCalled();
  });
});
