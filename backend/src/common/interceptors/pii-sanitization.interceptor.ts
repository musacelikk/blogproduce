import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

/**
 * PII Sanitization Interceptor
 * Removes sensitive data from logs (prompts, user inputs, etc.)
 */
@Injectable()
export class PiiSanitizationInterceptor implements NestInterceptor {
  private readonly logger = new Logger(PiiSanitizationInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, query, params } = request;

    // Sanitize request body (remove sensitive fields)
    const sanitizedBody = this.sanitizeBody(body);

    // Log request without sensitive data
    this.logger.log(
      `${method} ${url} - Query: ${JSON.stringify(query)} - Params: ${JSON.stringify(params)} - Body: ${JSON.stringify(sanitizedBody)}`,
    );

    return next.handle().pipe(
      tap({
        next: (data) => {
          // Log response (sanitized if needed)
          const sanitizedResponse = this.sanitizeResponse(data);
          this.logger.debug(`Response: ${JSON.stringify(sanitizedResponse).substring(0, 500)}`);
        },
        error: (error) => {
          // Log error without sensitive data
          this.logger.error(
            `Error: ${error.message} - Status: ${error.status || 'unknown'}`,
            error.stack,
          );
        },
      }),
    );
  }

  /**
   * Credential-bearing keys — matched as substrings, case-insensitively, so
   * newPassword/currentPassword/clientSecret/refresh_token are all covered.
   */
  private static readonly SECRET_PATTERNS = [
    'password',
    'token',
    'secret',
    'apikey',
    'api_key',
    'authorization',
    'credential',
    'signature',
  ];

  /** Free-text keys that may contain user content/PII but are not credentials. */
  private static readonly PII_PATTERNS = [
    'topic',
    'additionalcontext',
    'prompt',
    'content',
    'input',
    'message',
    'text',
    'description',
    'email',
    'phone',
  ];

  private static isSecretKey(key: string): boolean {
    const normalized = key.toLowerCase();
    return PiiSanitizationInterceptor.SECRET_PATTERNS.some((p) => normalized.includes(p));
  }

  private static isPiiKey(key: string): boolean {
    const normalized = key.toLowerCase();
    return PiiSanitizationInterceptor.PII_PATTERNS.some((p) => normalized.includes(p));
  }

  /**
   * Sanitize request body - remove sensitive fields
   */
  private sanitizeBody(body: any): any {
    if (!body || typeof body !== 'object') {
      return body;
    }

    const sanitized = { ...body };

    for (const key in sanitized) {
      if (typeof sanitized[key] !== 'string' || sanitized[key].length === 0) {
        continue;
      }

      if (PiiSanitizationInterceptor.isSecretKey(key)) {
        // Credentials are never previewed — even a "first 20 chars" preview leaks
        // short passwords in full.
        sanitized[key] = '[REDACTED]';
      } else if (PiiSanitizationInterceptor.isPiiKey(key)) {
        // Content fields are truncated so logs stay useful for debugging.
        sanitized[key] = `[REDACTED - ${sanitized[key].length} chars]`;
      }
    }

    // Recursively sanitize nested objects
    for (const key in sanitized) {
      if (sanitized[key] && typeof sanitized[key] === 'object' && !Array.isArray(sanitized[key])) {
        sanitized[key] = this.sanitizeBody(sanitized[key]);
      } else if (Array.isArray(sanitized[key])) {
        sanitized[key] = sanitized[key].map((item: any) =>
          typeof item === 'object' ? this.sanitizeBody(item) : item,
        );
      }
    }

    return sanitized;
  }

  /**
   * Sanitize response if needed
   */
  private sanitizeResponse(data: any): any {
    if (!data || typeof data !== 'object') {
      return data;
    }

    // Don't log full response data, just metadata
    if (data.success !== undefined) {
      return {
        success: data.success,
        message: data.message,
        data: data.data ? '[DATA]' : undefined,
        error: data.error ? '[ERROR]' : undefined,
      };
    }

    return '[RESPONSE]';
  }
}

