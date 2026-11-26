import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { ApiKey } from '../../entities/api-key.entity';
import { ApiKeyRateLimit } from '../../entities/api-key-rate-limit.entity';

export enum RateLimitType {
  GENERAL = 'general',
  GENERATE = 'generate',
}

/** Counter rows older than this are pruned. Two days keeps "yesterday" intact. */
const RETENTION_DAYS = 2;

/**
 * Rate limiting is a counter under contention, so it moves in **one statement**.
 *
 * `api_key_rate_limits` is uniquely indexed on (api_key_id, window_start). The
 * guard used to SELECT the row, miss, and INSERT — so two requests arriving in
 * the same minute both missed and both inserted, and the loser left
 * canActivate with "duplicate key value violates unique constraint
 * IDX_4640b4ba18f96deaea001edce6": a 500 for a request that was inside its
 * limit. Read-then-write also loses increments outright, which is the quieter
 * half of the same bug — a lost increment is an allowance spent for free.
 *
 * `INSERT … ON CONFLICT … DO UPDATE … RETURNING` makes the create-or-increment
 * a single round trip whose result is the post-increment count, so the database
 * resolves the race instead of reporting it.
 *
 * One row per (key, minute). The daily generate allowance is the **sum** of
 * that day's rows rather than a counter of its own: the old code inserted a
 * daily row with a full-precision `window_start`, so every miss created another
 * row for the same date and the count was split across them — the daily limit
 * silently under-counted for the rest of the day.
 */
@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly logger = new Logger(RateLimitGuard.name);

  constructor(
    @InjectRepository(ApiKey)
    private apiKeyRepository: Repository<ApiKey>,
    @InjectRepository(ApiKeyRateLimit)
    private rateLimitRepository: Repository<ApiKeyRateLimit>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.apiKey as ApiKey | undefined;

    // If no API key (JWT auth), skip rate limiting
    if (!apiKey) {
      return true;
    }

    // Check if rate limiting is enabled for this key
    if (
      apiKey.requestsPerMinute === null &&
      apiKey.dailyGenerateLimit === null &&
      apiKey.monthlyTokenBudget === null
    ) {
      return true; // No limits configured
    }

    const rateLimitType = this.getRateLimitType(request);
    const now = new Date();
    const windowStart = this.minuteWindow(now);
    const today = this.utcDate(now);

    // 1. Check RPM (Requests Per Minute) - for all requests
    if (apiKey.requestsPerMinute !== null && apiKey.requestsPerMinute > 0) {
      const count = await this.bump(apiKey.id, windowStart, today, 'request_count');

      if (count > apiKey.requestsPerMinute) {
        throw new HttpException(
          {
            success: false,
            message: `Rate limit exceeded: ${apiKey.requestsPerMinute} requests per minute allowed`,
            error: 'RATE_LIMIT_EXCEEDED',
            retryAfter: 60, // seconds
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }

    // 2. Check Daily Generate Limit (only for generate requests)
    if (
      rateLimitType === RateLimitType.GENERATE &&
      apiKey.dailyGenerateLimit !== null &&
      apiKey.dailyGenerateLimit > 0
    ) {
      await this.bump(apiKey.id, windowStart, today, 'generate_count');
      const used = await this.generatesToday(apiKey.id, today);

      if (used > apiKey.dailyGenerateLimit) {
        throw new HttpException(
          {
            success: false,
            message: `Daily generate limit exceeded: ${apiKey.dailyGenerateLimit} generates per day allowed`,
            error: 'DAILY_GENERATE_LIMIT_EXCEEDED',
            retryAfter: this.getSecondsUntilMidnight(),
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }

    // 3. Check Monthly Token Budget (will be checked after request completes)
    // This is handled in the service layer after we know token usage

    return true;
  }

  /**
   * Create-or-increment the counter row for this (key, minute) and return the
   * value *after* the increment.
   *
   * `id` and `"createdAt"` are supplied explicitly rather than left to column
   * defaults: the table was created by `synchronize`, so whether it carries a
   * `uuid_generate_v4()` default depends on which TypeORM wrote it, and an
   * insert that relies on one it does not have fails as a not-null violation.
   *
   * `xmax = 0` distinguishes the insert from the update, which is what makes
   * pruning cheap — it runs on the first request of a minute, not on every one.
   */
  private async bump(
    apiKeyId: string,
    windowStart: Date,
    date: string,
    column: 'request_count' | 'generate_count',
  ): Promise<number> {
    const rows = await this.rateLimitRepository.query(
      `INSERT INTO api_key_rate_limits
         (id, api_key_id, window_start, date, request_count, generate_count, "createdAt")
       VALUES ($1, $2, $3, $4, $5, $6, now())
       ON CONFLICT (api_key_id, window_start)
       DO UPDATE SET ${column} = api_key_rate_limits.${column} + 1
       RETURNING ${column} AS count, (xmax = 0) AS inserted`,
      [
        randomUUID(),
        apiKeyId,
        windowStart,
        date,
        column === 'request_count' ? 1 : 0,
        column === 'generate_count' ? 1 : 0,
      ],
    );

    const row = rows?.[0];
    if (row?.inserted) {
      await this.prune(apiKeyId, date);
    }

    return Number(row?.count ?? 0);
  }

  /** The day's allowance is the sum over the day's minute rows. */
  private async generatesToday(apiKeyId: string, date: string): Promise<number> {
    const rows = await this.rateLimitRepository.query(
      `SELECT COALESCE(SUM(generate_count), 0) AS count
         FROM api_key_rate_limits
        WHERE api_key_id = $1 AND date = $2`,
      [apiKeyId, date],
    );
    return Number(rows?.[0]?.count ?? 0);
  }

  /**
   * Prune previous days only. The old cleanup deleted anything older than two
   * *minutes*, which with a summed daily counter would erase the day's history
   * and reset the allowance — so the boundary is the date, not the window.
   *
   * A failure here must never reject the request it was incidental to.
   */
  private async prune(apiKeyId: string, today: string): Promise<void> {
    try {
      await this.rateLimitRepository.query(
        `DELETE FROM api_key_rate_limits
          WHERE api_key_id = $1 AND date < ($2::date - $3::int)`,
        [apiKeyId, today, RETENTION_DAYS],
      );
    } catch (error) {
      this.logger.warn(
        `Rate-limit prune failed for key ${apiKeyId}: ${
          error instanceof Error ? error.message : 'unknown error'
        }`,
      );
    }
  }

  /** Minute boundary, matching the unique index's granularity. */
  private minuteWindow(now: Date): Date {
    const window = new Date(now);
    window.setSeconds(0, 0);
    return window;
  }

  /** `YYYY-MM-DD` in UTC, so the day boundary does not move with the host. */
  private utcDate(now: Date): string {
    return now.toISOString().slice(0, 10);
  }

  private getRateLimitType(request: any): RateLimitType {
    // Check if this is a generate request
    const path = request.url || request.path || '';
    const method = request.method || '';

    if (method === 'POST' && (path.includes('/generate') || path.includes('/api/blog/generate'))) {
      return RateLimitType.GENERATE;
    }

    return RateLimitType.GENERAL;
  }

  /** Seconds to the next UTC midnight — the same boundary `date` is keyed on. */
  private getSecondsUntilMidnight(): number {
    const now = new Date();
    const midnight = Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + 1,
      0,
      0,
      0,
      0,
    );
    return Math.max(1, Math.ceil((midnight - now.getTime()) / 1000));
  }
}
