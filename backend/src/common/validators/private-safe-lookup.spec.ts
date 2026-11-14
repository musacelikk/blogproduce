jest.mock('dns', () => ({ lookup: jest.fn() }));

import { lookup as dnsLookup } from 'dns';
import { privateSafeLookup } from './is-public-https-url.validator';

/**
 * The connect-time guard.
 *
 * This is the only layer that sees DNS rebinding — a hostname that passes every
 * textual check and then resolves to 169.254.169.254. It is passed as the
 * `lookup` option to `https.request`, so the address it returns is the one the
 * socket connects to and there is no second resolution to race.
 *
 * Exercised against a mocked resolver because the callback shapes (single
 * address vs the `all: true` array) are exactly what a refactor breaks.
 */
const mockLookup = dnsLookup as unknown as jest.Mock;

function resolveVia(
  host: string,
  options: any = {},
): Promise<{ err: NodeJS.ErrnoException | null; address?: any; family?: number }> {
  return new Promise((resolve) => {
    privateSafeLookup(host, options, (err, address, family) => resolve({ err, address, family }));
  });
}

describe('privateSafeLookup', () => {
  beforeEach(() => mockLookup.mockReset());

  it('passes through a public answer unchanged', async () => {
    mockLookup.mockImplementation((_h, _o, cb) => cb(null, '93.184.216.34', 4));

    const { err, address, family } = await resolveVia('example.com');

    expect(err).toBeNull();
    expect(address).toBe('93.184.216.34');
    expect(family).toBe(4);
  });

  it('refuses a name that resolves to cloud metadata', async () => {
    // The rebinding case: nothing about the hostname looks wrong.
    mockLookup.mockImplementation((_h, _o, cb) => cb(null, '169.254.169.254', 4));

    const { err } = await resolveVia('totally-normal-host.example.com');

    expect(err).toBeTruthy();
    expect((err as any).code).toBe('EPRIVATEADDR');
  });

  it('refuses a name that resolves to loopback over IPv6', async () => {
    mockLookup.mockImplementation((_h, _o, cb) => cb(null, '::1', 6));

    const { err } = await resolveVia('rebind.example.com');

    expect((err as any)?.code).toBe('EPRIVATEADDR');
  });

  it('refuses when any address in an all:true answer is private', async () => {
    // A resolver returning several records must not be judged on the first one.
    mockLookup.mockImplementation((_h, _o, cb) =>
      cb(null, [
        { address: '93.184.216.34', family: 4 },
        { address: '10.0.0.5', family: 4 },
      ]),
    );

    const { err } = await resolveVia('mixed.example.com', { all: true });

    expect((err as any)?.code).toBe('EPRIVATEADDR');
  });

  it('passes through an all:true answer that is entirely public', async () => {
    const records = [
      { address: '93.184.216.34', family: 4 },
      { address: '2606:4700:4700::1111', family: 6 },
    ];
    mockLookup.mockImplementation((_h, _o, cb) => cb(null, records));

    const { err, address } = await resolveVia('public.example.com', { all: true });

    expect(err).toBeNull();
    expect(address).toEqual(records);
  });

  it('propagates a resolver error rather than masking it', async () => {
    const failure = Object.assign(new Error('ENOTFOUND'), { code: 'ENOTFOUND' });
    mockLookup.mockImplementation((_h, _o, cb) => cb(failure));

    const { err } = await resolveVia('nope.example.com');

    expect((err as any)?.code).toBe('ENOTFOUND');
  });
});
