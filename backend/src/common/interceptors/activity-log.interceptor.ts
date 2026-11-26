import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActivityLog, ActivityType, ActivitySeverity } from '../../entities/activity-log.entity';
import { Request } from 'express';
import { User } from '../../entities/user.entity';

/**
 * Column widths declared on ActivityLog. Every value written here comes from
 * the request — the URL, the body, a header — so none of it is bounded by us.
 * An over-long value aborts the whole INSERT with "value too long for type
 * character varying(255)", and since the write is deliberately non-fatal the
 * only trace is an ERROR line and a lost activity record.
 *
 * `activity-log.interceptor.spec.ts` pins these against the entity.
 */
const MAX_ACTION = 255;
const MAX_TARGET_TYPE = 100;
const MAX_TARGET_NAME = 255;
const MAX_IP_ADDRESS = 45;

/** Rows are kept small: the body is context for an audit line, not a copy of it. */
const MAX_DETAILS_CHARS = 8_000;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function clamp(value: unknown, max: number): string | null {
  if (value === null || value === undefined) return null;
  const text = typeof value === 'string' ? value : String(value);
  if (text.length === 0) return null;
  return text.length > max ? text.slice(0, max) : text;
}

/**
 * `targetId` is a uuid column. A body field named `id` is caller-supplied and
 * frequently not a uuid at all, which fails the INSERT with "invalid input
 * syntax for type uuid" — the same silent loss as an over-long value.
 */
function asUuid(value: unknown): string | null {
  return typeof value === 'string' && UUID_PATTERN.test(value) ? value : null;
}

@Injectable()
export class ActivityLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ActivityLogInterceptor.name);

  constructor(
    @InjectRepository(ActivityLog)
    private activityLogRepository: Repository<ActivityLog>,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request & { user?: User }>();
    const { method, url, body, user } = request;

    // IP adresini al (proxy arkasında olabilir)
    const ipAddress =
      (request.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      (request.headers['x-real-ip'] as string) ||
      request.ip ||
      request.socket.remoteAddress ||
      'unknown';

    const userAgent = request.headers['user-agent'] || 'unknown';

    // Aktivite tipini belirle
    let activityType: ActivityType = ActivityType.SYSTEM;
    let action = `${method} ${url}`;
    let severity: ActivitySeverity = ActivitySeverity.INFO;

    if (url.includes('/auth/login')) {
      activityType = ActivityType.AUTH;
      action = 'Giriş yapıldı';
      severity = ActivitySeverity.SUCCESS;
    } else if (url.includes('/auth/register')) {
      activityType = ActivityType.AUTH;
      action = 'Kayıt olundu';
      severity = ActivitySeverity.SUCCESS;
    } else if (url.includes('/auth/logout')) {
      activityType = ActivityType.AUTH;
      action = 'Çıkış yapıldı';
    } else if (url.includes('/posts/generate') || url.includes('/posts')) {
      activityType = ActivityType.BLOG;
      if (method === 'POST') {
        action = 'Blog oluşturuldu';
        severity = ActivitySeverity.SUCCESS;
      } else if (method === 'PUT' || method === 'PATCH') {
        action = 'Blog güncellendi';
      } else if (method === 'DELETE') {
        action = 'Blog silindi';
        severity = ActivitySeverity.WARNING;
      }
    } else if (url.includes('/users') || url.includes('/admin/users')) {
      activityType = ActivityType.USER;
      if (method === 'POST') {
        action = 'Kullanıcı oluşturuldu';
        severity = ActivitySeverity.SUCCESS;
      } else if (method === 'PUT' || method === 'PATCH') {
        action = 'Kullanıcı güncellendi';
      } else if (method === 'DELETE') {
        action = 'Kullanıcı silindi';
        severity = ActivitySeverity.WARNING;
      }
    }

    return next.handle().pipe(
      tap({
        next: async (data) => {
          // Başarılı işlemleri logla
          try {
            const targetId = asUuid(body?.id);
            const log = this.activityLogRepository.create({
              type: activityType,
              action: clamp(action, MAX_ACTION) ?? method,
              userId: user?.id || null,
              targetType: targetId ? clamp('entity', MAX_TARGET_TYPE) : null,
              targetId,
              targetName: clamp(body?.title ?? body?.name, MAX_TARGET_NAME),
              details: method !== 'GET' ? { body: this.sanitizeBody(body) } : null,
              ipAddress: clamp(ipAddress, MAX_IP_ADDRESS),
              userAgent,
              severity,
            });
            await this.activityLogRepository.save(log);
          } catch (error) {
            // Log kaydetme hatası uygulamayı durdurmamalı
            this.logger.error(`Failed to save activity log: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
          }
        },
        error: async (error) => {
          // Hataları logla
          try {
            const targetId = asUuid(body?.id);
            const log = this.activityLogRepository.create({
              type: activityType,
              // Clamp the suffix on too: truncating `action` first and then
              // appending would push the result back over the limit.
              action: clamp(`${action} (HATA)`, MAX_ACTION) ?? method,
              userId: user?.id || null,
              targetType: targetId ? clamp('entity', MAX_TARGET_TYPE) : null,
              targetId,
              targetName: clamp(body?.title ?? body?.name, MAX_TARGET_NAME),
              details: {
                error: clamp(error?.message, MAX_DETAILS_CHARS),
                body: this.sanitizeBody(body),
              },
              ipAddress: clamp(ipAddress, MAX_IP_ADDRESS),
              userAgent,
              severity: ActivitySeverity.ERROR,
            });
            await this.activityLogRepository.save(log);
          } catch (logError) {
            this.logger.error(`Failed to save error activity log: ${logError instanceof Error ? logError.message : 'Unknown error'}`, logError instanceof Error ? logError.stack : undefined);
          }
        },
      }),
    );
  }

  private sanitizeBody(body: any): any {
    if (!body) return null;
    const sanitized = { ...body };
    // Şifreleri loglamayalım
    if (sanitized.password) {
      sanitized.password = '***';
    }
    if (sanitized.currentPassword) {
      sanitized.currentPassword = '***';
    }
    if (sanitized.newPassword) {
      sanitized.newPassword = '***';
    }

    // `details` is jsonb, so an over-long value will not fail the INSERT — it
    // just stores it. A generate request carries the whole article, and this
    // table is written on *every* request, so unbounded bodies grow it without
    // limit. Long strings are replaced by their length, which is what an audit
    // line actually needs.
    for (const key of Object.keys(sanitized)) {
      const value = sanitized[key];
      if (typeof value === 'string' && value.length > MAX_DETAILS_CHARS) {
        sanitized[key] = `[${value.length} chars]`;
      }
    }

    // Whatever is left (nested objects, arrays) is bounded as a whole.
    const serialized = JSON.stringify(sanitized);
    if (serialized !== undefined && serialized.length > MAX_DETAILS_CHARS) {
      return { truncated: true, bytes: serialized.length };
    }

    return sanitized;
  }
}

