import { HttpException, Logger } from '@nestjs/common';

/**
 * Report a failure at the level its status code deserves.
 *
 * A 404 from `/api/v1/published/:slug` is the endpoint working: the caller
 * asked for an article this project does not publish. Logging it as ERROR with
 * a stack trace — which every catch block, the PII interceptor and the
 * structured logger each did independently, so one request produced three —
 * makes the log a stream of alarms with nothing to act on, and buries the 500s
 * that do need acting on.
 *
 * 4xx is the client's problem and logs as a single warning line. 5xx is ours
 * and keeps the stack.
 */
export function statusOf(error: unknown): number {
  if (error instanceof HttpException) {
    return error.getStatus();
  }
  const status = (error as { status?: unknown })?.status;
  return typeof status === 'number' ? status : 500;
}

/** True when the failure is the caller's, not the server's. */
export function isClientError(error: unknown): boolean {
  const status = statusOf(error);
  return status >= 400 && status < 500;
}

export function logByStatus(logger: Logger, message: string, error: unknown): void {
  const status = statusOf(error);
  const detail = error instanceof Error ? error.message : String(error);

  if (status >= 400 && status < 500) {
    logger.warn(`${message}: ${status} ${detail}`);
    return;
  }

  logger.error(`${message}: ${detail}`, error instanceof Error ? error.stack : undefined);
}
