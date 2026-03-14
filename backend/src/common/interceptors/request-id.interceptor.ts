import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';

/**
 * Request ID Interceptor
 * Adds a unique requestId to every request and response
 * Essential for tracing and debugging
 */
@Injectable()
export class RequestIdInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    // Generate or use existing request ID
    const requestId = request.headers['x-request-id'] || uuidv4();

    // Attach to request for use in services
    request.requestId = requestId;
    request.id = requestId; // Also set as id for compatibility

    // Add to response headers
    response.setHeader('X-Request-ID', requestId);

    return next.handle().pipe(
      // Transform response to include requestId
      (source) => {
        return new Observable((observer) => {
          source.subscribe({
            next: (value) => {
              // Add requestId to response if it's an object
              if (value && typeof value === 'object') {
                if (!value.requestId) {
                  value.requestId = requestId;
                }
                // Also add to meta if exists
                if (value.meta && typeof value.meta === 'object') {
                  value.meta.requestId = requestId;
                }
              }
              observer.next(value);
            },
            error: (err) => {
              // Add requestId to error response
              if (err.response && typeof err.response === 'object') {
                err.response.requestId = requestId;
              }
              observer.error(err);
            },
            complete: () => observer.complete(),
          });
        });
      },
    );
  }
}

