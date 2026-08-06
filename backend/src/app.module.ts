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
import { WorkerModule } from './worker/worker.module';
import { AssetsModule } from './assets/assets.module';
import { UsageModule } from './usage/usage.module';
import { AdminModule } from './admin/admin.module';
import { UnsplashModule } from './unsplash/unsplash.module';
import { FAQModule } from './faq/faq.module';
import { ContactModule } from './contact/contact.module';
import { Notification } from './entities/notification.entity';
import { NotificationModule } from './notification/notification.module';
import { User } from './entities/user.entity';
import { Workspace } from './entities/workspace.entity';
import { Site } from './entities/site.entity';
import { Post } from './entities/post.entity';
import { PostRevision } from './entities/post-revision.entity';
import { PostSeo } from './entities/post-seo.entity';
import { Tag } from './entities/tag.entity';
import { Asset } from './entities/asset.entity';
import { PostAsset } from './entities/post-asset.entity';
import { Job } from './entities/job.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { UsageLedger } from './entities/usage-ledger.entity';
import { ActivityLog } from './entities/activity-log.entity';
import { PlanDefinition } from './entities/plan-definition.entity';
import { Subscription } from './entities/subscription.entity';
import { Payment } from './entities/payment.entity';
import { FAQ } from './entities/faq.entity';
import { Contact } from './entities/contact.entity';
import { EventTracking } from './entities/event-tracking.entity';
import { UserBehavior } from './entities/user-behavior.entity';
import { ApiKey } from './entities/api-key.entity';
import { Webhook } from './entities/webhook.entity';
import { Organization } from './entities/organization.entity';
import { Project } from './entities/project.entity';
import { GenerationJob } from './entities/generation-job.entity';
import { UsageEvent } from './entities/usage-event.entity';
import { ApiKeySecret } from './entities/api-key-secret.entity';
import { ApiKeyRateLimit } from './entities/api-key-rate-limit.entity';
import { IdempotencyKey } from './entities/idempotency-key.entity';
import { TokenPack } from './entities/token-pack.entity';
import { TokenPurchase } from './entities/token-purchase.entity';
import { Settings } from './entities/settings.entity';
import { PlansModule } from './plans/plans.module';
import { ApiModule } from './api/api.module';
import { BillingModule } from './billing/billing.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { ActivityLogInterceptor } from './common/interceptors/activity-log.interceptor';
import { PiiSanitizationInterceptor } from './common/interceptors/pii-sanitization.interceptor';
import { RequestIdInterceptor } from './common/interceptors/request-id.interceptor';
import { StructuredLoggingInterceptor } from './common/interceptors/structured-logging.interceptor';

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
      useFactory: (configService: ConfigService) => {
        const dbUrl = configService.get<string>('DATABASE_URL');
        
        if (dbUrl) {
          // Parse PostgreSQL connection URL
          const url = new URL(dbUrl);
          return {
            type: 'postgres',
            host: url.hostname,
            port: parseInt(url.port, 10),
            username: url.username,
            password: url.password,
            database: url.pathname.slice(1), // Remove leading '/'
            entities: [
              User,
              Workspace,
              Site,
              Post,
              PostRevision,
              PostSeo,
              Tag,
              Asset,
              PostAsset,
              Job,
              RefreshToken,
              UsageLedger,
              ActivityLog,
            PlanDefinition,
            Subscription,
            Payment,
            FAQ,
              Contact,
              Notification,
              EventTracking,
              UserBehavior,
              ApiKey,
              Webhook,
              Organization,
              Project,
              GenerationJob,
              UsageEvent,
              ApiKeySecret,
              ApiKeyRateLimit,
              IdempotencyKey,
            TokenPack,
            TokenPurchase,
              TokenPack,
              TokenPurchase,
              Settings,
            ],
            // Auto-sync alters the live schema on boot. Off in production unless
            // DB_SYNCHRONIZE=true is set deliberately (e.g. a first deploy).
            synchronize:
              configService.get<string>('NODE_ENV') !== 'production' ||
              configService.get<string>('DB_SYNCHRONIZE') === 'true',
            logging: false,
            ssl: configService.get<string>('NODE_ENV') === 'production' ? {
              rejectUnauthorized: false,
            } : false,
          };
        }
        
        // Fallback to individual config values
        return {
          type: 'postgres',
          host: configService.get<string>('DB_HOST') || 'localhost',
          port: configService.get<number>('DB_PORT') || 5432,
          username: configService.get<string>('DB_USERNAME') || 'postgres',
          password: configService.get<string>('DB_PASSWORD') || 'postgres',
          database: configService.get<string>('DB_NAME') || 'railway',
          entities: [
            User,
            Workspace,
            Site,
            Post,
            PostRevision,
            PostSeo,
            Tag,
            Asset,
            PostAsset,
            Job,
            RefreshToken,
            UsageLedger,
            ActivityLog,
            PlanDefinition,
            Subscription,
            Payment,
            FAQ,
            Contact,
            Notification,
            EventTracking,
            UserBehavior,
            ApiKey,
            Webhook,
            Organization,
            Project,
            GenerationJob,
            UsageEvent,
            ApiKeySecret,
            ApiKeyRateLimit,
            IdempotencyKey,
            TokenPack,
            TokenPurchase,
            Settings,
          ],
          synchronize:
            configService.get<string>('NODE_ENV') !== 'production' ||
            configService.get<string>('DB_SYNCHRONIZE') === 'true',
          logging: false,
          ssl: configService.get<string>('DB_SSL') === 'true' ? {
            rejectUnauthorized: false,
          } : false,
        };
      },
      inject: [ConfigService],
    }),
    AuthModule,
    WorkspacesModule,
    SitesModule,
    PostsModule,
    JobsModule,
    BlogModule,
    WorkerModule,
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

