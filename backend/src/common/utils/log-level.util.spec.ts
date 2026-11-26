import { BadRequestException, Logger, NotFoundException } from '@nestjs/common';
import { isClientError, logByStatus, statusOf } from './log-level.util';

/**
 * One 404 on `/api/v1/published/:slug` produced three ERROR lines with stack
 * traces — from the service's catch block, the PII interceptor and the
 * structured logger, each deciding independently. A log where a customer's
 * stale link looks exactly like a server fault is a log nobody can act on.
 */
describe('logByStatus', () => {
  function buildLogger() {
    const logger = new Logger('test');
    const warn = jest.spyOn(logger, 'warn').mockImplementation(() => undefined);
    const error = jest.spyOn(logger, 'error').mockImplementation(() => undefined);
    return { logger, warn, error };
  }

  it('reads the status off a Nest HttpException', () => {
    expect(statusOf(new NotFoundException('Post not found'))).toBe(404);
    expect(statusOf(new BadRequestException('Invalid cursor'))).toBe(400);
  });

  it('treats an unknown failure as a server fault', () => {
    expect(statusOf(new Error('boom'))).toBe(500);
    expect(statusOf(undefined)).toBe(500);
    expect(isClientError(new Error('boom'))).toBe(false);
  });

  it('logs a 404 as a single warning with no stack', () => {
    const { logger, warn, error } = buildLogger();

    logByStatus(logger, 'Error getting published post via API', new NotFoundException('Post not found'));

    expect(error).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]).toHaveLength(1);
    expect(warn.mock.calls[0][0]).toContain('404');
  });

  it('keeps a 500 at error level with its stack', () => {
    const { logger, warn, error } = buildLogger();

    logByStatus(logger, 'Error generating post via API', new Error('provider exploded'));

    expect(warn).not.toHaveBeenCalled();
    expect(error).toHaveBeenCalledTimes(1);
    expect(error.mock.calls[0][1]).toContain('provider exploded');
  });

  it('keeps a 502 from a provider at error level', () => {
    const { logger, error } = buildLogger();

    logByStatus(logger, 'upstream', Object.assign(new Error('bad gateway'), { status: 502 }));

    expect(error).toHaveBeenCalledTimes(1);
  });
});
