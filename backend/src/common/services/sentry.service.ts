import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// Optional Sentry import - only if package is installed
let Sentry: any = null;
try {
  Sentry = require('@sentry/node');
} catch (e) {
  // Sentry not installed, will be handled gracefully
}

/**
 * Sentry Error Tracking Service
 * Initializes and configures Sentry for error tracking
 */
@Injectable()
export class SentryService implements OnModuleInit {
  private readonly logger = new Logger(SentryService.name);
  private initialized = false;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    if (!Sentry) {
      this.logger.warn('@sentry/node package not installed, error tracking disabled');
      return;
    }

    const dsn = this.configService.get<string>('SENTRY_DSN');
    const environment = this.configService.get<string>('NODE_ENV', 'development');

    if (!dsn) {
      this.logger.warn('SENTRY_DSN not configured, error tracking disabled');
      return;
    }

    try {
      Sentry.init({
        dsn,
        environment,
        tracesSampleRate: environment === 'production' ? 0.1 : 1.0, // 10% in prod, 100% in dev
        integrations: [
          new Sentry.Integrations.Http({ tracing: true }),
          new Sentry.Integrations.Express({ app: undefined }), // Will be set in main.ts
        ],
        beforeSend(event: any, hint: any) {
          // Filter out sensitive data
          if (event.request) {
            // Remove sensitive headers
            if (event.request.headers) {
              delete event.request.headers.authorization;
              delete event.request.headers.cookie;
            }
            // Sanitize body
            if (event.request.data) {
              event.request.data = this.sanitizeData(event.request.data);
            }
          }
          return event;
        },
      });

      this.initialized = true;
      this.logger.log('Sentry initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Sentry', error);
    }
  }

  /**
   * Capture exception
   */
  captureException(exception: any, context?: Record<string, any>) {
    if (!this.initialized || !Sentry) {
      return;
    }

    Sentry.withScope((scope: any) => {
      if (context) {
        Object.entries(context).forEach(([key, value]) => {
          scope.setContext(key, value);
        });
      }
      Sentry.captureException(exception);
    });
  }

  /**
   * Capture message
   */
  captureMessage(message: string, level: string = 'info', context?: Record<string, any>) {
    if (!this.initialized || !Sentry) {
      return;
    }

    Sentry.withScope((scope: any) => {
      if (context) {
        Object.entries(context).forEach(([key, value]) => {
          scope.setContext(key, value);
        });
      }
      Sentry.captureMessage(message, level);
    });
  }

  /**
   * Set user context
   */
  setUser(user: { id?: string; email?: string; username?: string }) {
    if (!this.initialized || !Sentry) {
      return;
    }

    Sentry.setUser(user);
  }

  /**
   * Add breadcrumb
   */
  addBreadcrumb(breadcrumb: any) {
    if (!this.initialized || !Sentry) {
      return;
    }

    Sentry.addBreadcrumb(breadcrumb);
  }

  /**
   * Sanitize sensitive data
   */
  private sanitizeData(data: any): any {
    if (!data || typeof data !== 'object') {
      return data;
    }

    const sensitiveFields = ['password', 'token', 'apiKey', 'secret', 'authorization', 'topic', 'content', 'prompt'];
    const sanitized = { ...data };

    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }

    return sanitized;
  }
}

