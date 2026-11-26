import { HttpException } from '@nestjs/common';
import { RateLimitGuard } from './rate-limit.guard';

/**
 * The rate-limit counters are uniquely indexed on (api_key_id, window_start),
 * and the guard used to read the row, miss, then INSERT. Two requests arriving
 * in the same minute therefore both missed and both inserted, and the loser got
 *
 *   duplicate key value violates unique constraint "IDX_4640b4ba..."
 *
 * thrown out of canActivate — a 500 for a request that was inside its limit.
 * The counter has to move in one statement, so concurrency is resolved by the
 * database rather than lost by it.
 *
 * The daily counter had the same read-then-write shape and a second defect:
 * the row it inserted carried a full-precision window_start, so every miss
 * created another row for the same date and the generate count was split
 * across them — the daily limit under-counted for the rest of the day.
 */

/** A repository whose `query` really is atomic: callers interleave, rows don't. */
function buildRepository() {
  const rows: Array<{
    apiKeyId: string;
    windowStart: number;
    date: string;
    requestCount: number;
    generateCount: number;
  }> = [];
  const statements: string[] = [];

  const query = jest.fn(async (sql: string, params: any[] = []) => {
    statements.push(sql);
    const normalized = sql.replace(/\s+/g, ' ').trim().toUpperCase();

    if (normalized.startsWith('INSERT INTO API_KEY_RATE_LIMITS')) {
      if (!normalized.includes('ON CONFLICT')) {
        throw new Error('non-atomic insert: no ON CONFLICT clause');
      }
      const column = normalized.includes('REQUEST_COUNT = ') ? 'requestCount' : 'generateCount';
      // The statement supplies the row id itself rather than relying on a
      // column default, so the key/window/date parameters start at $2.
      const [, apiKeyId, windowStart, date] = params;
      const key = new Date(windowStart).getTime();
      let row = rows.find((r) => r.apiKeyId === apiKeyId && r.windowStart === key);
      let inserted = false;
      if (!row) {
        row = { apiKeyId, windowStart: key, date, requestCount: 0, generateCount: 0 };
        rows.push(row);
        inserted = true;
      }
      row[column] += 1;
      return [{ count: String(row[column]), inserted }];
    }

    if (normalized.startsWith('SELECT')) {
      const [apiKeyId, date] = params;
      const total = rows
        .filter((r) => r.apiKeyId === apiKeyId && r.date === date)
        .reduce((sum, r) => sum + r.generateCount, 0);
      return [{ count: String(total) }];
    }

    if (normalized.startsWith('DELETE')) {
      return [];
    }

    throw new Error(`unexpected statement: ${sql}`);
  });

  return {
    repository: {
      query,
      findOne: jest.fn(() => {
        throw new Error('findOne is a read-then-write: the counter must move atomically');
      }),
      save: jest.fn(() => {
        throw new Error('save is a read-then-write: the counter must move atomically');
      }),
      delete: jest.fn(() => {
        throw new Error('delete must go through the atomic path');
      }),
    },
    rows,
    statements,
  };
}

function buildGuard(apiKey: any) {
  const { repository, rows, statements } = buildRepository();
  const guard = new RateLimitGuard({} as any, repository as any);
  const contextFor = (url = '/api/v1/posts', method = 'GET') =>
    ({
      switchToHttp: () => ({ getRequest: () => ({ apiKey, url, method }) }),
    }) as any;
  return { guard, repository, rows, statements, contextFor };
}

const KEY = {
  id: 'key-1',
  requestsPerMinute: 3,
  dailyGenerateLimit: null,
  monthlyTokenBudget: null,
};

describe('RateLimitGuard concurrency', () => {
  it('does not throw a duplicate-key error when requests race in one minute', async () => {
    const { guard, contextFor } = buildGuard({ ...KEY, requestsPerMinute: 100 });

    const results = await Promise.allSettled(
      Array.from({ length: 20 }, () => guard.canActivate(contextFor())),
    );

    const unexpected = results.filter(
      (r) => r.status === 'rejected' && !(r.reason instanceof HttpException),
    );
    expect(unexpected).toEqual([]);
    expect(results.every((r) => r.status === 'fulfilled')).toBe(true);
  });

  it('counts every racing request exactly once', async () => {
    const { guard, rows, contextFor } = buildGuard({ ...KEY, requestsPerMinute: 100 });

    await Promise.all(Array.from({ length: 20 }, () => guard.canActivate(contextFor())));

    expect(rows).toHaveLength(1);
    expect(rows[0].requestCount).toBe(20);
  });

  it('admits exactly the allowance and rejects the rest with 429', async () => {
    const { guard, contextFor } = buildGuard({ ...KEY, requestsPerMinute: 3 });

    const results = await Promise.allSettled(
      Array.from({ length: 10 }, () => guard.canActivate(contextFor())),
    );

    const admitted = results.filter((r) => r.status === 'fulfilled');
    const refused = results.filter((r) => r.status === 'rejected');
    expect(admitted).toHaveLength(3);
    expect(refused).toHaveLength(7);
    for (const r of refused) {
      expect((r as PromiseRejectedResult).reason).toBeInstanceOf(HttpException);
      expect((r as PromiseRejectedResult).reason.getStatus()).toBe(429);
    }
  });

  it('keeps the daily generate count on one date rather than splitting it per row', async () => {
    const apiKey = {
      id: 'key-2',
      requestsPerMinute: null,
      dailyGenerateLimit: 5,
      monthlyTokenBudget: null,
    };
    const { guard, contextFor } = buildGuard(apiKey);

    // Generate requests spread across different minutes of the same day.
    const base = Date.now();
    const results: Array<'ok' | 'refused'> = [];
    for (let i = 0; i < 8; i++) {
      jest.useFakeTimers().setSystemTime(base + i * 60_000);
      try {
        await guard.canActivate(contextFor('/api/v1/posts/generate', 'POST'));
        results.push('ok');
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        results.push('refused');
      }
    }
    jest.useRealTimers();

    expect(results.filter((r) => r === 'ok')).toHaveLength(5);
    expect(results.filter((r) => r === 'refused')).toHaveLength(3);
  });

  it('skips the database entirely for a key with no limits', async () => {
    const { guard, repository, contextFor } = buildGuard({
      id: 'key-3',
      requestsPerMinute: null,
      dailyGenerateLimit: null,
      monthlyTokenBudget: null,
    });

    await expect(guard.canActivate(contextFor())).resolves.toBe(true);
    expect(repository.query).not.toHaveBeenCalled();
  });

  it('lets JWT requests through untouched', async () => {
    const { guard, repository } = buildGuard(undefined);
    const context = {
      switchToHttp: () => ({ getRequest: () => ({ url: '/posts', method: 'GET' }) }),
    } as any;

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(repository.query).not.toHaveBeenCalled();
  });
});
