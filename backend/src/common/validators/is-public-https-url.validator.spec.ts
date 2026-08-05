import { isPrivateHost } from './is-public-https-url.validator';

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
