import { BadRequestException } from '@nestjs/common';
import {
  assertPublicHttpsUrl,
  isPrivateAddress,
  isPrivateHost,
} from './is-public-https-url.validator';

describe('isPrivateHost', () => {
  it.each([
    'localhost',
    'api.localhost',
    'service.internal',
    'printer.local',
    '127.0.0.1',
    '10.0.0.5',
    '172.16.0.1',
    '172.31.255.254',
    '192.168.1.1',
    '169.254.169.254', // cloud metadata endpoint
    '0.0.0.0',
    '100.64.0.1',
    '::1',
    'fe80::1',
    'fd00::1',
    '::ffff:127.0.0.1',
  ])('blocks %s', (host) => {
    expect(isPrivateHost(host)).toBe(true);
  });

  it.each(['example.com', 'hooks.slack.com', '8.8.8.8', '172.32.0.1', '2606:4700::1111'])(
    'allows %s',
    (host) => {
      expect(isPrivateHost(host)).toBe(false);
    },
  );
});

/**
 * Alternate spellings of an address.
 *
 * `net.isIP()` recognises only canonical dotted-quad, so a check built on it
 * answers "not an IP, therefore a public hostname" and passes the string to a
 * resolver that understands every form below. These are the literals that used
 * to walk straight through.
 */
describe('isPrivateHost — alternate IPv4 literals', () => {
  const bypasses: Array<[string, string]> = [
    ['2130706433', '127.0.0.1 as a single 32-bit integer'],
    ['0x7f000001', '127.0.0.1 in hex'],
    ['0177.0.0.1', '127.0.0.1 with an octal first octet'],
    ['0x7f.0.0.1', '127.0.0.1 with a hex first octet'],
    ['127.1', '127.0.0.1 in short form'],
    ['127.0.1', '127.0.0.1 in three-part form'],
    ['2852039166', '169.254.169.254 — cloud metadata as an integer'],
    ['0251.0376.0251.0376', '169.254.169.254 in octal'],
    ['3232235777', '192.168.1.1 as an integer'],
    ['167772161', '10.0.0.1 as an integer'],
  ];

  it.each(bypasses)('blocks %s (%s)', (host) => {
    expect(isPrivateHost(host)).toBe(true);
  });

  it('still allows a public address written as an integer', () => {
    // 134744072 === 8.8.8.8 — the parser must not block everything it parses.
    expect(isPrivateHost('134744072')).toBe(false);
  });

  it('treats a trailing root dot as the same name', () => {
    expect(isPrivateHost('localhost.')).toBe(true);
  });

  it('fails closed on an empty host', () => {
    expect(isPrivateHost('')).toBe(true);
  });

  it('treats a string that is no IP literal as a hostname, not as blocked', () => {
    // '0x' parses as no address, so it is a (strange) name. Blocking every
    // unparseable string would block most of the internet; what a name
    // *resolves* to is privateSafeLookup's job, at connect time.
    expect(isPrivateHost('0x')).toBe(false);
  });
});

describe('isPrivateHost — further IPv6 forms', () => {
  it.each([
    ['::', 'unspecified'],
    ['::127.0.0.1', 'IPv4-compatible loopback'],
    ['fe80::1%eth0', 'link-local with a zone id'],
    ['ff02::1', 'multicast'],
    ['64:ff9b::7f00:1', 'NAT64 prefix reaching IPv4 space'],
    ['fdff::1', 'unique local'],
  ])('blocks %s (%s)', (host) => {
    expect(isPrivateHost(host)).toBe(true);
  });

  it('allows a public IPv6 address', () => {
    expect(isPrivateHost('2606:4700:4700::1111')).toBe(false);
  });
});

describe('assertPublicHttpsUrl', () => {
  it('accepts a public https url', () => {
    expect(() => assertPublicHttpsUrl('https://hooks.example.com/abc')).not.toThrow();
  });

  it('rejects http, even to a public host', () => {
    expect(() => assertPublicHttpsUrl('http://example.com')).toThrow(BadRequestException);
  });

  it('rejects an alternate-literal loopback url', () => {
    expect(() => assertPublicHttpsUrl('https://2130706433/hook')).toThrow(BadRequestException);
  });

  it('rejects a non-string', () => {
    expect(() => assertPublicHttpsUrl(undefined)).toThrow(BadRequestException);
  });
});

describe('isPrivateAddress — what a resolver returned', () => {
  it('rejects a private answer', () => {
    expect(isPrivateAddress('169.254.169.254', 4)).toBe(true);
    expect(isPrivateAddress('::1', 6)).toBe(true);
  });

  it('accepts a public answer', () => {
    expect(isPrivateAddress('93.184.216.34', 4)).toBe(false);
  });
});
