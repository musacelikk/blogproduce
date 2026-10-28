import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseModule } from '../database/database.module';
import { buildTypeOrmOptions } from '../database/typeorm.config';
import { WorkerModule } from './worker.module';

/**
 * The worker process's root module.
 *
 * The worker used to bootstrap the full `AppModule`, which meant a process that
 * only consumes SQS messages also constructed every controller, guard, passport
 * strategy, global interceptor, the throttler, Express itself, and the asset
 * pipeline — none of which it can reach, since it runs through
 * `createApplicationContext` and never listens on a port.
 *
 * What it actually needs is the database, the queue, and the AI pipeline, which
 * is what `WorkerModule` already declares. Everything else was resident memory
 * billed for nothing.
 *
 * Consequences worth knowing:
 * - `@nestjs/schedule` crons live in the modules the API loads, so they no
 *   longer fire twice. The atomic claims that made double-firing safe are still
 *   there — correctness never depended on this module's shape.
 * - `DatabaseModule` is kept so a worker that boots first after a deploy still
 *   applies pending schema statements. It is serialised with the API by the
 *   same advisory lock.
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      // 'worker' only narrows the connection pool — see typeorm.config.ts.
      useFactory: (config: ConfigService) => buildTypeOrmOptions(config, 'worker'),
      inject: [ConfigService],
    }),
    DatabaseModule,
    WorkerModule,
  ],
})
export class WorkerAppModule {}
