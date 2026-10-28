import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

import { User } from '../entities/user.entity';
import { Workspace } from '../entities/workspace.entity';
import { Site } from '../entities/site.entity';
import { Post } from '../entities/post.entity';
import { PostRevision } from '../entities/post-revision.entity';
import { PostSeo } from '../entities/post-seo.entity';
import { Tag } from '../entities/tag.entity';
import { Asset } from '../entities/asset.entity';
import { PostAsset } from '../entities/post-asset.entity';
import { Job } from '../entities/job.entity';
import { RefreshToken } from '../entities/refresh-token.entity';
import { UsageLedger } from '../entities/usage-ledger.entity';
import { ActivityLog } from '../entities/activity-log.entity';
import { PlanDefinition } from '../entities/plan-definition.entity';
import { Subscription } from '../entities/subscription.entity';
import { Payment } from '../entities/payment.entity';
import { FAQ } from '../entities/faq.entity';
import { Contact } from '../entities/contact.entity';
import { Notification } from '../entities/notification.entity';
import { EventTracking } from '../entities/event-tracking.entity';
import { UserBehavior } from '../entities/user-behavior.entity';
import { ApiKey } from '../entities/api-key.entity';
import { Webhook } from '../entities/webhook.entity';
import { Organization } from '../entities/organization.entity';
import { Project } from '../entities/project.entity';
import { GenerationJob } from '../entities/generation-job.entity';
import { UsageEvent } from '../entities/usage-event.entity';
import { ApiKeySecret } from '../entities/api-key-secret.entity';
import { ApiKeyRateLimit } from '../entities/api-key-rate-limit.entity';
import { IdempotencyKey } from '../entities/idempotency-key.entity';
import { TokenPack } from '../entities/token-pack.entity';
import { TokenPurchase } from '../entities/token-purchase.entity';
import { Settings } from '../entities/settings.entity';
import { AutopilotConfig } from '../entities/autopilot-config.entity';
import { TopicIdea } from '../entities/topic-idea.entity';

/**
 * Every mapped entity, in one place.
 *
 * TypeORM selects all mapped columns, so an entity missing from the list a
 * process boots with takes down every query that touches it. Keeping a single
 * array means the API and the worker cannot drift apart — they were previously
 * two hand-maintained copies in `app.module.ts`, which had already duplicated
 * two entries.
 */
export const ALL_ENTITIES = [
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
  AutopilotConfig,
  TopicIdea,
];

/**
 * Per-process connection pool size.
 *
 * The worker processes one SQS message at a time (`MaxNumberOfMessages: 1`) and
 * spends most of each job awaiting a provider, so the driver default of 10
 * connections is eight more than it can ever use — and an idle pg connection
 * costs memory on both ends, the database included.
 */
const POOL_SIZE = { api: 10, worker: 3 } as const;

export type ProcessRole = keyof typeof POOL_SIZE;

/**
 * Connection options shared by the API and worker processes.
 *
 * Accepts either a single `DATABASE_URL` or the individual `DB_*` values.
 * `synchronize` stays off in production — `SchemaMigratorService` applies the
 * additive statement lists in `database/migrations/` at boot instead.
 *
 * `role` only sizes the pool; everything else is identical between the two, and
 * deliberately so — the entity list especially must not diverge.
 */
export function buildTypeOrmOptions(
  configService: ConfigService,
  role: ProcessRole = 'api',
): TypeOrmModuleOptions {
  const isProduction = configService.get<string>('NODE_ENV') === 'production';
  const synchronize = !isProduction || configService.get<string>('DB_SYNCHRONIZE') === 'true';

  const dbUrl = configService.get<string>('DATABASE_URL');

  if (dbUrl) {
    const url = new URL(dbUrl);
    return {
      type: 'postgres',
      host: url.hostname,
      port: parseInt(url.port, 10),
      username: url.username,
      password: url.password,
      database: url.pathname.slice(1),
      entities: ALL_ENTITIES,
      poolSize: POOL_SIZE[role],
      synchronize,
      logging: false,
      ssl: isProduction ? { rejectUnauthorized: false } : false,
    };
  }

  return {
    type: 'postgres',
    host: configService.get<string>('DB_HOST') || 'localhost',
    port: configService.get<number>('DB_PORT') || 5432,
    username: configService.get<string>('DB_USERNAME') || 'postgres',
    password: configService.get<string>('DB_PASSWORD') || 'postgres',
    database: configService.get<string>('DB_NAME') || 'railway',
    entities: ALL_ENTITIES,
    poolSize: POOL_SIZE[role],
    synchronize,
    logging: false,
    ssl: configService.get<string>('DB_SSL') === 'true' ? { rejectUnauthorized: false } : false,
  };
}
