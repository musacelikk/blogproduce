import { WebhookService } from './webhook.service';
import { WebhookEvent } from '../entities/webhook.entity';

/**
 * Delivery refuses non-public targets.
 *
 * Pinned at this level on purpose. `privateSafeLookup` guards hostnames at
 * connect time, but Node skips `lookup` for IP literals and connects straight
 * to them — so literals are covered only by the `isPrivateHost` call in
 * `sendWebhook`. If that line is ever dropped in a refactor, the connect-time
 * guard will not catch it and these tests are what fails instead.
 */
function serviceWith(url: string) {
  const webhook: any = {
    id: 'wh-1',
    url,
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

describe('webhook delivery target guard', () => {
  const blocked: Array<[string, string]> = [
    ['https://127.0.0.1/hook', 'loopback literal'],
    ['https://169.254.169.254/latest/meta-data', 'cloud metadata'],
    ['https://2130706433/hook', 'loopback as a 32-bit integer'],
    ['https://0177.0.0.1/hook', 'loopback in octal'],
    ['https://[::1]/hook', 'IPv6 loopback'],
    ['https://10.0.0.5/hook', 'RFC1918'],
    ['http://example.com/hook', 'plain http to a public host'],
  ];

  it.each(blocked)('refuses %s (%s)', async (url) => {
    const { service, repo } = serviceWith(url);

    // triggerWebhook settles each delivery, so a refusal surfaces as "nothing
    // was delivered" rather than a throw — assert no success was recorded.
    await service.triggerWebhook('org-1', 'proj-1', WebhookEvent.POST_PUBLISHED, { a: 1 });

    const saved = repo.save.mock.calls.map(([w]: any[]) => w);
    expect(saved.every((w) => !w.lastTriggeredAt)).toBe(true);
  });
});
