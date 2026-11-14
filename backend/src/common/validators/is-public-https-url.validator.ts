import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { BadRequestException } from '@nestjs/common';
import { isIP } from 'net';
import { lookup as dnsLookup, LookupAddress } from 'dns';

/**
 * SSRF guards for user-supplied outbound URLs (webhooks today).
 *
 * Three layers, because no single one is sufficient:
 *
 *  1. `isPrivateHost` — a string check on the literal host. It must understand
 *     every spelling of an address the *resolver* understands, not just the
 *     canonical one.
 *  2. `assertPublicHttpsUrl` — enforced in the service before persisting, so a
 *     write path that forgets its DTO decorators is still covered.
 *  3. `privateSafeLookup` — a `dns.lookup` replacement used at connect time. The
 *     string check cannot see DNS rebinding: a public name that resolves to
 *     169.254.169.254 passes every textual test there is.
 */

// ---------------------------------------------------------------- IPv4

/**
 * Parses the IPv4 spellings `inet_aton` (and therefore glibc's resolver)
 * accepts, which is far more than dotted-quad decimal:
 *
 *   2130706433        → 127.0.0.1   (single 32-bit integer)
 *   0x7f.0.0.1        → 127.0.0.1   (hex octet)
 *   0177.0.0.1        → 127.0.0.1   (octal octet)
 *   127.1             → 127.0.0.1   (last part spans the remaining octets)
 *
 * `net.isIP()` recognises none of these, so a check built on it alone reports
 * "not an IP, therefore a public hostname" and hands the request straight to a
 * resolver that *does* understand them. Returns the address as a 32-bit number,
 * or null when the string is not an IPv4 literal in any of these forms.
 */
function parseIpv4Loose(host: string): number | null {
  const parts = host.split('.');
  if (parts.length === 0 || parts.length > 4) return null;

  const values: number[] = [];
  for (const part of parts) {
    if (part === '') return null;

    let value: number;
    if (/^0[xX][0-9a-fA-F]+$/.test(part)) {
      value = parseInt(part.slice(2), 16);
    } else if (/^0[0-7]+$/.test(part)) {
      value = parseInt(part.slice(1), 8);
    } else if (/^(0|[1-9][0-9]*)$/.test(part)) {
      value = parseInt(part, 10);
    } else {
      return null;
    }

    if (!Number.isFinite(value) || value < 0) return null;
    values.push(value);
  }

  // Every part but the last is a single octet; the last fills what remains.
  const lastMax = Math.pow(256, 4 - values.length + 1);
  for (let i = 0; i < values.length - 1; i++) {
    if (values[i] > 255) return null;
  }
  if (values[values.length - 1] >= lastMax) return null;

  let address = 0;
  for (let i = 0; i < values.length - 1; i++) {
    address += values[i] * Math.pow(256, 3 - i);
  }
  address += values[values.length - 1];

  return address >>> 0;
}

/** Ranges that must never be reachable, tested against a parsed 32-bit address. */
function isPrivateIpv4(address: number): boolean {
  const a = (address >>> 24) & 0xff;
  const b = (address >>> 16) & 0xff;

  if (a === 0) return true; // 0.0.0.0/8 — "this" network
  if (a === 10) return true; // 10.0.0.0/8
  if (a === 127) return true; // loopback
  if (a === 169 && b === 254) return true; // link-local, incl. cloud metadata
  if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
  if (a === 192 && b === 168) return true; // 192.168.0.0/16
  if (a === 192 && b === 0) return true; // 192.0.0.0/24 IETF protocol assignments
  if (a === 100 && b >= 64 && b <= 127) return true; // carrier-grade NAT
  if (a === 198 && (b === 18 || b === 19)) return true; // benchmarking
  if (a >= 224) return true; // multicast, reserved, broadcast

  return false;
}

// ---------------------------------------------------------------- IPv6

function isPrivateIpv6(host: string): boolean {
  const h = host.toLowerCase();

  if (h === '::1' || h === '::') return true; // loopback, unspecified
  if (/^fe[89ab]/.test(h)) return true; // fe80::/10 link-local
  if (/^f[cd]/.test(h)) return true; // fc00::/7 unique local
  if (h.startsWith('ff')) return true; // multicast
  if (h.startsWith('2001:db8')) return true; // documentation
  if (h.startsWith('64:ff9b')) return true; // NAT64 — reaches IPv4 space

  // IPv4-mapped (::ffff:127.0.0.1) and IPv4-compatible (::127.0.0.1): both are
  // IPv4 wearing an IPv6 spelling, so they are judged as IPv4.
  const embedded = h.match(/:((?:\d+\.){3}\d+)$/);
  if (embedded) {
    const address = parseIpv4Loose(embedded[1]);
    return address === null ? true : isPrivateIpv4(address);
  }

  return false;
}

// ---------------------------------------------------------------- host

/**
 * Hosts that must never be reachable from a user-supplied outbound URL.
 *
 * Fails **closed**: a host this cannot make sense of is treated as private
 * rather than waved through, which is the opposite of the previous behaviour
 * and the reason alternate IPv4 literals used to pass.
 */
function isPrivateHost(hostname: string): boolean {
  if (!hostname) return true;

  // Strip IPv6 brackets and the root-zone trailing dot ("example.com." is the
  // same name to a resolver, but a different string to a blocklist).
  const host = hostname
    .toLowerCase()
    .replace(/^\[|\]$/g, '')
    .replace(/\.$/, '');
  if (!host) return true;

  if (
    host === 'localhost' ||
    host.endsWith('.localhost') ||
    host.endsWith('.internal') ||
    host.endsWith('.local') ||
    host.endsWith('.home.arpa') ||
    host.endsWith('.in-addr.arpa') ||
    host.endsWith('.ip6.arpa')
  ) {
    return true;
  }

  if (isIP(host) === 6 || host.includes(':')) return isPrivateIpv6(host);

  const ipv4 = parseIpv4Loose(host);
  if (ipv4 !== null) return isPrivateIpv4(ipv4);

  // A real hostname. Whether it *resolves* somewhere private is not knowable
  // here — `privateSafeLookup` is what covers that, at connect time.
  return false;
}

/** True when a resolved address is one we refuse to connect to. */
function isPrivateAddress(address: string, family: number): boolean {
  if (family === 6) return isPrivateIpv6(address);
  const parsed = parseIpv4Loose(address);
  return parsed === null ? true : isPrivateIpv4(parsed);
}

/**
 * A `dns.lookup` replacement for outbound requests.
 *
 * Pass as the `lookup` option to `http(s).request` and DNS rebinding closes
 * with no time-of-check/time-of-use gap: the address this returns is the one
 * the socket connects to, so there is no second resolution to race.
 */
function privateSafeLookup(
  hostname: string,
  options: any,
  callback: (err: NodeJS.ErrnoException | null, address?: any, family?: number) => void,
): void {
  dnsLookup(hostname, options, (err: NodeJS.ErrnoException | null, address: any, family: any) => {
    if (err) return callback(err);

    const records: LookupAddress[] = Array.isArray(address) ? address : [{ address, family }];

    for (const record of records) {
      if (isPrivateAddress(record.address, record.family)) {
        return callback(
          Object.assign(
            new Error(`Refusing to connect to ${hostname}: resolves to a private address`),
            { code: 'EPRIVATEADDR' },
          ),
        );
      }
    }

    return Array.isArray(address)
      ? callback(null, address as any)
      : callback(null, address, family);
  });
}

// ---------------------------------------------------------------- entrypoints

/** True when `value` is an https URL pointing at a public host. */
function isPublicHttpsUrl(value: unknown): boolean {
  if (typeof value !== 'string') return false;

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }

  if (url.protocol !== 'https:') return false;
  if (!url.hostname) return false;

  return !isPrivateHost(url.hostname);
}

/**
 * Service-layer enforcement.
 *
 * The decorators cover the request bodies that declare them, but a partial
 * update typed as `Partial<SomeDto>` erases to `Object` at runtime and
 * class-validator silently validates nothing. Calling this before persisting
 * means the rule holds regardless of how the value arrived.
 */
function assertPublicHttpsUrl(value: unknown, field = 'url'): void {
  if (!isPublicHttpsUrl(value)) {
    throw new BadRequestException(
      `${field} must be a public https URL (private and loopback addresses are not allowed)`,
    );
  }
}

@ValidatorConstraint({ name: 'isPublicHttpsUrl', async: false })
class IsPublicHttpsUrlConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    return isPublicHttpsUrl(value);
  }

  defaultMessage(args: ValidationArguments): string {
    return `${args.property} must be a public https URL (private and loopback addresses are not allowed)`;
  }
}

export function IsPublicHttpsUrl(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsPublicHttpsUrlConstraint,
    });
  };
}

export {
  isPrivateHost,
  isPrivateAddress,
  isPublicHttpsUrl,
  assertPublicHttpsUrl,
  privateSafeLookup,
  parseIpv4Loose,
};
