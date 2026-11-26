import { of, throwError } from 'rxjs';
import { ActivityLogInterceptor } from './activity-log.interceptor';

/**
 * The activity log is written from request data — URL, body, headers — into
 * columns with fixed widths. Nothing bounded those values, so a long URL or a
 * long post title aborted the INSERT with
 *
 *   value too long for type character varying(255)
 *
 * The write is wrapped in try/catch, so the request still succeeded: the
 * failure was silent except for an ERROR line, and the activity it was meant
 * to record was simply lost. These pin the column widths declared on
 * ActivityLog, so the values handed to the repository always fit.
 */
const LIMITS = {
  action: 255,
  targetType: 100,
  targetName: 255,
  ipAddress: 45,
};

function buildInterceptor() {
  const saved: any[] = [];
  const repository = {
    create: (entity: any) => entity,
    save: jest.fn((entity: any) => {
      saved.push(entity);
      return Promise.resolve(entity);
    }),
  };
  const interceptor = new ActivityLogInterceptor(repository as any);
  return { interceptor, repository, saved };
}

function contextFor(request: any) {
  return {
    switchToHttp: () => ({ getRequest: () => request }),
  } as any;
}

function requestFor(overrides: any = {}) {
  return {
    method: 'POST',
    url: '/posts',
    body: {},
    headers: { 'user-agent': 'jest' },
    ip: '10.0.0.1',
    socket: { remoteAddress: '10.0.0.1' },
    ...overrides,
  };
}

async function run(interceptor: ActivityLogInterceptor, request: any, fail = false) {
  const handler = {
    handle: () =>
      fail ? throwError(() => Object.assign(new Error('boom'), { status: 500 })) : of({ ok: true }),
  };
  await new Promise<void>((resolve) => {
    interceptor.intercept(contextFor(request), handler as any).subscribe({
      next: () => resolve(),
      error: () => resolve(),
    });
  });
  // the tap handlers are async; let their microtasks drain
  await new Promise((resolve) => setImmediate(resolve));
}

function expectWithinLimits(log: any) {
  for (const [field, max] of Object.entries(LIMITS)) {
    const value = log[field];
    if (value === null || value === undefined) continue;
    expect(typeof value).toBe('string');
    expect(value.length).toBeLessThanOrEqual(max);
  }
}

describe('ActivityLogInterceptor column widths', () => {
  it('keeps action within varchar(255) for a very long URL', async () => {
    const { interceptor, saved } = buildInterceptor();
    const url = `/admin/users?search=${'a'.repeat(900)}`;

    await run(interceptor, requestFor({ method: 'GET', url }));

    expect(saved).toHaveLength(1);
    expectWithinLimits(saved[0]);
  });

  it('keeps targetName within varchar(255) for a long post title', async () => {
    const { interceptor, saved } = buildInterceptor();

    await run(
      interceptor,
      requestFor({ body: { title: 'Lüks salon dekorasyonu '.repeat(60) } }),
    );

    expect(saved).toHaveLength(1);
    expect(saved[0].targetName.length).toBeLessThanOrEqual(LIMITS.targetName);
    expectWithinLimits(saved[0]);
  });

  it('keeps ipAddress within varchar(45) when x-forwarded-for is junk', async () => {
    const { interceptor, saved } = buildInterceptor();

    await run(
      interceptor,
      requestFor({ headers: { 'x-forwarded-for': 'x'.repeat(300), 'user-agent': 'jest' } }),
    );

    expect(saved).toHaveLength(1);
    expectWithinLimits(saved[0]);
  });

  it('does not put a non-uuid body id into the uuid targetId column', async () => {
    const { interceptor, saved } = buildInterceptor();

    await run(interceptor, requestFor({ body: { id: 'not-a-uuid', title: 'x' } }));

    expect(saved).toHaveLength(1);
    expect(saved[0].targetId).toBeNull();
  });

  it('passes a real uuid body id straight through', async () => {
    const { interceptor, saved } = buildInterceptor();
    const id = '3f2504e0-4f89-41d3-9a0c-0305e82c3301';

    await run(interceptor, requestFor({ body: { id } }));

    expect(saved[0].targetId).toBe(id);
    expect(saved[0].targetType).toBe('entity');
  });

  it('truncates on the error path too', async () => {
    const { interceptor, saved } = buildInterceptor();
    const url = `/posts/${'b'.repeat(900)}`;

    await run(interceptor, requestFor({ url, body: { title: 'c'.repeat(900) } }), true);

    expect(saved).toHaveLength(1);
    expectWithinLimits(saved[0]);
  });

  it('bounds the details payload so one request cannot write an unbounded row', async () => {
    const { interceptor, saved } = buildInterceptor();

    await run(interceptor, requestFor({ body: { content: 'd'.repeat(5_000_000) } }));

    expect(saved).toHaveLength(1);
    expect(JSON.stringify(saved[0].details).length).toBeLessThan(100_000);
  });
});
