import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR, APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { BlogModule } from './blog/blog.module';
import { AuthModule } from './auth/auth.module';
import { WorkspacesModule } from './workspaces/workspaces.module';
import { SitesModule } from './sites/sites.module';
import { PostsModule } from './posts/posts.module';
import { JobsModule } from './jobs/jobs.module';
import { AssetsModule } from './assets/assets.module';
import { UsageModule } from './usage/usage.module';
import { AdminModule } from './admin/admin.module';
import { UnsplashModule } from './unsplash/unsplash.module';
import { FAQModule } from './faq/faq.module';
import { ContactModule } from './contact/contact.module';
import { NotificationModule } from './notification/notification.module';
import { PlansModule } from './plans/plans.module';
import { ApiModule } from './api/api.module';
import { BillingModule } from './billing/billing.module';
import { DatabaseModule } from './database/database.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { AutopilotModule } from './autopilot/autopilot.module';
import { ActivityLog } from './entities/activity-log.entity';
import { buildTypeOrmOptions } from './database/typeorm.config';
import { ActivityLogInterceptor } from './common/interceptors/activity-log.interceptor';
import { PiiSanitizationInterceptor } from './common/interceptors/pii-sanitization.interceptor';
import { RequestIdInterceptor } from './common/interceptors/request-id.interceptor';
import { StructuredLoggingInterceptor } from './common/interceptors/structured-logging.interceptor';

/**
 * The API process's module graph.
 *
 * Note that `WorkerModule` is deliberately **not** imported here. `WorkerService`
 * is only ever started from `worker.main.ts`, so importing it into the API
 * process loaded both AI SDKs and the SQS consumer for code that never ran.
 * The worker has its own root module (`worker/worker-app.module.ts`).
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          name: 'default',
          ttl: 60_000,
          limit: config.get<number>('THROTTLE_LIMIT', 150),
        },
      ],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: buildTypeOrmOptions,
      inject: [ConfigService],
    }),
    DatabaseModule,
    AuthModule,
    WorkspacesModule,
    SitesModule,
    PostsModule,
    JobsModule,
    BlogModule,
    AssetsModule,
    UsageModule,
    AdminModule,
    UnsplashModule,
    FAQModule,
    ContactModule,
    NotificationModule,
    PlansModule,
    BillingModule,
    ApiModule,
    OrganizationsModule,
    AutopilotModule,
    TypeOrmModule.forFeature([ActivityLog]),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: RequestIdInterceptor, // First: Add request ID
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: StructuredLoggingInterceptor, // Second: Structured logging
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ActivityLogInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: PiiSanitizationInterceptor,
    },
  ],
})
export class AppModule {}
