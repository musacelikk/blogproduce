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
   * Sanitize request body - remove sensitive fields
   */
  private sanitizeBody(body: any): any {
    if (!body || typeof body !== 'object') {
      return body;
    }

    const sanitized = { ...body };

    // Fields to sanitize (replace with [REDACTED])
    const sensitiveFields = [
      'topic',
      'additionalContext',
      'prompt',
      'content',
      'input',
      'message',
      'text',
      'description',
      'password',
      'token',
      'apiKey',
      'secret',
      'authorization',
    ];

    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        if (typeof sanitized[field] === 'string' && sanitized[field].length > 0) {
          // Show first 20 chars and indicate it's redacted
          const preview = sanitized[field].substring(0, 20);
          sanitized[field] = `${preview}... [REDACTED - ${sanitized[field].length} chars]`;
        } else {
          sanitized[field] = '[REDACTED]';
        }
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

