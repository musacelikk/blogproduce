process.env.WEBHOOK_DELIVERY_DEADLINE_MS = '120';

import { EventEmitter } from 'events';

const request = jest.fn();
jest.mock('https', () => ({ request: (...a: any[]) => request(...a) }));

import { WebhookService } from './webhook.service';
import { WebhookEvent } from '../entities/webhook.entity';

/**
 * Delivery limits.
 *
 * `options.timeout` on http.request is a socket *inactivity* timeout, so an
 * endpoint that sends a byte every nine seconds holds a request open forever —
 * and the response body used to be accumulated into a string that nothing ever
 * read. Together that is unbounded, remote-controlled memory growth. These pin
 * the two guards that close it.
 */
function fakeRequest() {
  const req: any = new EventEmitter();
  req.write = jest.fn();
  req.end = jest.fn();
  req.destroy = jest.fn(() => req.emit('__destroyed'));
  return req;
}

function serviceWith() {
  const webhook: any = {
    id: 'wh-1',
    url: 'https://hooks.example.com/x',
    secret: 'shh',
    events: [WebhookEvent.POST_PUBLISHED],
    active: true,
    organizationId: 'org-1',
    projectId: 'proj-1',
    failureCount: 0,
  };
  const repo = {
    find: jest.fn().mockResolvedValue([webhook]),
    save: jest.fn().mockResolvedValue(webhook),
  };
  return { service: new WebhookService(repo as any), repo, webhook };
}

describe('webhook delivery limits', () => {
  beforeEach(() => request.mockReset());

  it('drains the response instead of buffering it', async () => {
    const res: any = new EventEmitter();
    res.statusCode = 200;
    res.resume = jest.fn();

    request.mockImplementation((_opts: any, cb: any) => {
      const req = fakeRequest();
      setImmediate(() => {
        cb(res);
        // A remote endpoint can send as much as it likes; none of it may be
        // accumulated, so nothing here should reach a buffer.
        res.emit('data', 'x'.repeat(1_000_000));
        res.emit('end');
      });
      return req;
    });

    const { service } = serviceWith();
    await service.triggerWebhook('org-1', 'proj-1', WebhookEvent.POST_PUBLISHED, {});

    expect(res.resume).toHaveBeenCalled();
    // No 'data' listener of our own — resume() discards the stream.
    expect(res.listenerCount('data')).toBe(0);
  });

  it('destroys a request that never finishes, whatever the socket is doing', async () => {
    // The slow-drip case: bytes keep arriving, so the inactivity timeout never
    // fires, and without an absolute deadline this would hang forever.
    let destroyed = false;
    request.mockImplementation((_opts: any, cb: any) => {
      const req = fakeRequest();
      req.destroy = jest.fn(() => {
        destroyed = true;
      });
      const res: any = new EventEmitter();
      res.statusCode = 200;
      res.resume = jest.fn();
      setImmediate(() => cb(res)); // response starts, never ends
      return req;
    });

    const { service, repo } = serviceWith();
    await service.triggerWebhook('org-1', 'proj-1', WebhookEvent.POST_PUBLISHED, {});

    expect(destroyed).toBe(true);
    // Counted as a failure, not silently dropped.
    const saved = repo.save.mock.calls.map(([w]: any[]) => w);
    expect(saved.some((w) => w.failureCount > 0)).toBe(true);
  });

  it('leaves no pending timer once a delivery succeeds', async () => {
    const res: any = new EventEmitter();
    res.statusCode = 200;
    res.resume = jest.fn();
    request.mockImplementation((_opts: any, cb: any) => {
      const req = fakeRequest();
      setImmediate(() => {
        cb(res);
        res.emit('end');
      });
      return req;
    });

    const before = process.getActiveResourcesInfo?.().filter((r) => r === 'Timeout').length ?? 0;

    const { service } = serviceWith();
    await service.triggerWebhook('org-1', 'proj-1', WebhookEvent.POST_PUBLISHED, {});

    const after = process.getActiveResourcesInfo?.().filter((r) => r === 'Timeout').length ?? 0;
    // A deadline timer that outlives its request is itself a slow leak.
    expect(after).toBeLessThanOrEqual(before);
  });
});
