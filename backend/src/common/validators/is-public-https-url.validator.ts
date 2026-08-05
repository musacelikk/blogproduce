import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { isIP } from 'net';

/**
 * Hosts that must never be reachable from a user-supplied outbound URL.
 * Blocks the classic SSRF targets: loopback, link-local (incl. cloud metadata
 * at 169.254.169.254), and the RFC1918 private ranges.
 */
function isPrivateHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, '');

  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.internal') || host.endsWith('.local')) {
    return true;
  }

  const ipVersion = isIP(host);

  if (ipVersion === 4) {
    const parts = host.split('.').map(Number);
    const [a, b] = parts;
    if (a === 10) return true; // 10.0.0.0/8
    if (a === 127) return true; // loopback
    if (a === 0) return true; // "this" network
    if (a === 169 && b === 254) return true; // link-local / cloud metadata
    if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
    if (a === 192 && b === 168) return true; // 192.168.0.0/16
    if (a === 100 && b >= 64 && b <= 127) return true; // carrier-grade NAT
    if (a >= 224) return true; // multicast / reserved
    return false;
  }

  if (ipVersion === 6) {
    if (host === '::1' || host === '::') return true;
    if (host.startsWith('fe80')) return true; // link-local
    if (host.startsWith('fc') || host.startsWith('fd')) return true; // unique local
    // IPv4-mapped (e.g. ::ffff:127.0.0.1)
    const mapped = host.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (mapped) return isPrivateHost(mapped[1]);
    return false;
  }

  return false;
}

@ValidatorConstraint({ name: 'isPublicHttpsUrl', async: false })
class IsPublicHttpsUrlConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
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

export { isPrivateHost };
