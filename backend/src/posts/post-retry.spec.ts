import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PostsService } from './posts.service';
import { PostStatus } from '../entities/post.entity';
import { JobStatus } from '../entities/generation-job.entity';

/**
 * A failed generation used to be a dead end.
 *
 * The worker records why it failed in `posts.last_error` and stops; nothing in
 * the product reads it back. The customer saw "Başarısız" on the card, could
 * not see the reason, and had no way to run it again — the only recourse was
 * generating a fresh article and paying for it twice.
 *
 * Retry re-sends the *stored* request rather than reconstructing one, so the
 * second attempt is the same article, and it goes through the same billing
 * gate as any other generation: a retry cannot buy a tier the plan does not.
 *
 * The claim is a conditional UPDATE off FAILED, which is what stops a
 * double-click enqueueing two jobs — and two jobs is two articles billed.
 */
function buildService(overrides: any = {}) {
  const post = {
    id: 'post-1',
    status: PostStatus.FAILED,
    workspaceId: 'ws-1',
    organizationId: 'org-1',
    projectId: 'proj-1',
    lastError: 'OpenAI quota exceeded',
    ...overrides.post,
  };

  const workspace = { id: 'ws-1', name: 'Acme', ownerId: 'user-1', description: null };

  const job = {
    id: 'job-1',
    postId: 'post-1',
    status: JobStatus.FAILED,
    requestData: {
      topic: 'Garaj yönetiminde dijitalleşmenin faydaları',
      language: 'tr',
      tone: 'professional',
      length: 'long',
      seoMode: true,
      model: 'pro',
      additionalContext: 'kobi odaklı',
      targetAudience: 'servis sahipleri',
    },
    ...overrides.job,
  };

  const claim = {
    affected: overrides.claimAffected ?? 1,
  };
  const chain: any = {
    update: () => chain,
    set: jest.fn(() => chain),
    where: jest.fn(() => chain),
    andWhere: jest.fn(() => chain),
    execute: jest.fn().mockResolvedValue(claim),
  };

  const postsRepository = {
    findOne: jest.fn().mockResolvedValue(overrides.missingPost ? null : post),
    update: jest.fn().mockResolvedValue({ affected: 1 }),
    createQueryBuilder: jest.fn(() => chain),
  };

  const workspacesRepository = {
    findOne: jest.fn().mockResolvedValue(overrides.missingWorkspace ? null : workspace),
  };

  const generationJobRepository = {
    findOne: jest.fn().mockResolvedValue(overrides.missingJob ? null : job),
    create: (entity: any) => entity,
    save: jest.fn((entity: any) => Promise.resolve({ id: 'job-2', ...entity })),
  };

  const sqsService = {
    sendGeneratePostMessage: overrides.sqsFails
      ? jest.fn().mockRejectedValue(new Error('queue unreachable'))
      : jest.fn().mockResolvedValue(undefined),
  };

  const billingService = {
    authorizeGeneration: overrides.billingFails
      ? jest.fn().mockRejectedValue(new ForbiddenException('Token bakiyeniz yetersiz.'))
      : jest.fn().mockResolvedValue('pro'),
  };

  const service = new PostsService(
    postsRepository as any,
    workspacesRepository as any,
    {} as any, // tags
    {} as any, // revisions
    generationJobRepository as any,
    {} as any, // organizations
    {} as any, // projects
    sqsService as any,
    {} as any, // webhooks
    billingService as any,
    {} as any, // html sanitizer
  );

  return { service, postsRepository, generationJobRepository, sqsService, billingService, chain };
}

const user = { id: 'user-1' } as any;

describe('PostsService.retry', () => {
  it('re-enqueues the stored request rather than a reconstructed one', async () => {
    const { service, sqsService } = buildService();

    const result = await service.retry(user, 'post-1');

    expect(sqsService.sendGeneratePostMessage).toHaveBeenCalledTimes(1);
    const sent = sqsService.sendGeneratePostMessage.mock.calls[0][0];
    expect(sent.postId).toBe('post-1');
    expect(sent.topic).toBe('Garaj yönetiminde dijitalleşmenin faydaları');
    expect(sent.seoMode).toBe(true);
    expect(sent.additionalContext).toBe('kobi odaklı');
    expect(sent.jobId).toBe('job-2');
    expect(result.postId).toBe('post-1');
  });

  it('passes through the billing gate before spending anything', async () => {
    const { service, billingService, sqsService } = buildService({ billingFails: true });

    await expect(service.retry(user, 'post-1')).rejects.toBeInstanceOf(ForbiddenException);
    expect(billingService.authorizeGeneration).toHaveBeenCalledWith('user-1', 'pro');
    expect(sqsService.sendGeneratePostMessage).not.toHaveBeenCalled();
  });

  it('claims the post off FAILED so a double click cannot enqueue twice', async () => {
    const { service, chain } = buildService();

    await service.retry(user, 'post-1');

    expect(chain.execute).toHaveBeenCalledTimes(1);
    const where = chain.where.mock.calls[0];
    expect(JSON.stringify(where)).toContain('failed');
    const set = chain.set.mock.calls[0][0];
    expect(set.status).toBe(PostStatus.QUEUED);
    expect(set.lastError).toBeNull();
  });

  it('refuses when the claim finds nothing, instead of queueing a second job', async () => {
    const { service, sqsService } = buildService({ claimAffected: 0 });

    await expect(service.retry(user, 'post-1')).rejects.toBeInstanceOf(ConflictException);
    expect(sqsService.sendGeneratePostMessage).not.toHaveBeenCalled();
  });

  it('only retries a failed post', async () => {
    const { service } = buildService({ post: { status: PostStatus.PUBLISHED } });

    await expect(service.retry(user, 'post-1')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('refuses a post in another user\'s workspace', async () => {
    const { service } = buildService({ missingWorkspace: true });

    await expect(service.retry(user, 'post-1')).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('404s an unknown post', async () => {
    const { service } = buildService({ missingPost: true });

    await expect(service.retry(user, 'nope')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('refuses when no stored request survives to replay', async () => {
    const { service, sqsService } = buildService({ missingJob: true });

    await expect(service.retry(user, 'post-1')).rejects.toBeInstanceOf(BadRequestException);
    expect(sqsService.sendGeneratePostMessage).not.toHaveBeenCalled();
  });

  it('puts the post back to FAILED when the queue cannot be reached', async () => {
    const { service, postsRepository } = buildService({ sqsFails: true });

    await expect(service.retry(user, 'post-1')).rejects.toThrow();

    // Otherwise the post is stranded in QUEUED with no message behind it, and
    // the retry button is gone — the dead end the feature exists to remove.
    expect(postsRepository.update).toHaveBeenCalledWith(
      'post-1',
      expect.objectContaining({ status: PostStatus.FAILED }),
    );
  });
});
