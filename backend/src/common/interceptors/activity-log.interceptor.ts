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
            const log = this.activityLogRepository.create({
              type: activityType,
              action,
              userId: user?.id || null,
              targetType: body?.id ? 'entity' : null,
              targetId: body?.id || null,
              targetName: body?.title || body?.name || null,
              details: method !== 'GET' ? { body: this.sanitizeBody(body) } : null,
              ipAddress,
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
            const log = this.activityLogRepository.create({
              type: activityType,
              action: `${action} (HATA)`,
              userId: user?.id || null,
              targetType: body?.id ? 'entity' : null,
              targetId: body?.id || null,
              targetName: body?.title || body?.name || null,
              details: {
                error: error.message,
                body: this.sanitizeBody(body),
              },
              ipAddress,
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
    return sanitized;
  }
}

