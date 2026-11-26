import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { statusOf } from '../utils/log-level.util';

/**
 * Structured Logging Interceptor
 * Logs requests and responses in structured JSON format
 */
@Injectable()
export class StructuredLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(StructuredLoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const { method, url, ip, headers } = request;
    const requestId = request.requestId || request.id || 'unknown';
    const startTime = Date.now();

    // Log request
    this.logger.log(
      JSON.stringify({
        type: 'request',
        requestId,
        method,
        url,
        ip,
        userAgent: headers['user-agent'],
        timestamp: new Date().toISOString(),
      }),
    );

    return next.handle().pipe(
      tap({
        next: (data) => {
          const duration = Date.now() - startTime;
          const statusCode = response.statusCode;

          // Log successful response
          this.logger.log(
            JSON.stringify({
              type: 'response',
              requestId,
              method,
              url,
              statusCode,
              duration,
              timestamp: new Date().toISOString(),
            }),
          );
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          const statusCode = statusOf(error);

          // 4xx is the caller's problem and logs as a warning; reserving ERROR
          // for 5xx is what keeps a real fault visible among the 404s.
          const write =
            statusCode >= 400 && statusCode < 500
              ? this.logger.warn.bind(this.logger)
              : this.logger.error.bind(this.logger);

          // Log error response
          write(
            JSON.stringify({
              type: 'error',
              requestId,
              method,
              url,
              statusCode,
              duration,
              error: {
                message: error.message,
                name: error.name,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
              },
              timestamp: new Date().toISOString(),
            }),
          );
        },
      }),
    );
  }
}

