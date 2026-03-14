import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { ApiKey } from '../../entities/api-key.entity';
import { ApiKeyRateLimit } from '../../entities/api-key-rate-limit.entity';

export enum RateLimitType {
  GENERAL = 'general',
  GENERATE = 'generate',
}

@Injectable()
export class RateLimitGuard implements CanActivate {
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
    if (apiKey.requestsPerMinute === null && apiKey.dailyGenerateLimit === null && apiKey.monthlyTokenBudget === null) {
      return true; // No limits configured
    }

    const rateLimitType = this.getRateLimitType(request);
    const now = new Date();

    // 1. Check RPM (Requests Per Minute) - for all requests
    if (apiKey.requestsPerMinute !== null && apiKey.requestsPerMinute > 0) {
      const windowStart = new Date(now);
      windowStart.setSeconds(0, 0); // Round down to minute

      let rateLimit = await this.rateLimitRepository.findOne({
        where: {
          apiKeyId: apiKey.id,
          windowStart: windowStart,
        },
      });

      if (!rateLimit) {
        // Clean up old entries (older than 2 minutes)
        await this.rateLimitRepository.delete({
          apiKeyId: apiKey.id,
          windowStart: LessThan(new Date(now.getTime() - 2 * 60 * 1000)),
        });

        rateLimit = this.rateLimitRepository.create({
          apiKeyId: apiKey.id,
          windowStart: windowStart,
          date: new Date(now.toISOString().split('T')[0]),
          requestCount: 0,
          generateCount: 0,
        });
      }

      rateLimit.requestCount += 1;
      await this.rateLimitRepository.save(rateLimit);

      if (rateLimit.requestCount > apiKey.requestsPerMinute) {
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
    if (rateLimitType === RateLimitType.GENERATE && apiKey.dailyGenerateLimit !== null && apiKey.dailyGenerateLimit > 0) {
      const today = new Date(now.toISOString().split('T')[0]);

      let dailyLimit = await this.rateLimitRepository.findOne({
        where: {
          apiKeyId: apiKey.id,
          date: today,
        },
      });

      if (!dailyLimit) {
        // Clean up old entries (older than 2 days)
        const twoDaysAgo = new Date(now);
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
        await this.rateLimitRepository.delete({
          apiKeyId: apiKey.id,
          date: LessThan(twoDaysAgo),
        });

        dailyLimit = this.rateLimitRepository.create({
          apiKeyId: apiKey.id,
          windowStart: new Date(now),
          date: today,
          requestCount: 0,
          generateCount: 0,
        });
      }

      dailyLimit.generateCount += 1;
      await this.rateLimitRepository.save(dailyLimit);

      if (dailyLimit.generateCount > apiKey.dailyGenerateLimit) {
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

  private getRateLimitType(request: any): RateLimitType {
    // Check if this is a generate request
    const path = request.url || request.path || '';
    const method = request.method || '';

    if (method === 'POST' && (path.includes('/generate') || path.includes('/api/blog/generate'))) {
      return RateLimitType.GENERATE;
    }

    return RateLimitType.GENERAL;
  }

  private getSecondsUntilMidnight(): number {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    return Math.ceil((midnight.getTime() - now.getTime()) / 1000);
  }
}

