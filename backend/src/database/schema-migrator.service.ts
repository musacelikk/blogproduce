import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { BILLING_SCHEMA_001 } from './migrations/001-billing-schema';

export interface SchemaStatement {
  sql: string;
  /** Failure is expected on a re-run or an unsupported server; do not abort. */
  optional?: boolean;
}

/** Arbitrary but fixed — two processes must pick the same advisory-lock key. */
const ADVISORY_LOCK_KEY = 4_820_113_007;

/**
 * Applies additive schema changes at boot.
 *
 * This project has no migration framework and `synchronize` is off in
 * production, so a new entity column would otherwise break *every* query
 * against that table (TypeORM selects all mapped columns) until someone runs a
 * command by hand. Doing it on startup removes that manual step, which is the
 * step that actually gets forgotten.
 *
 * Safe by construction: every statement is additive and idempotent, and an
 * advisory lock keeps the API and worker processes from racing each other.
 * Set AUTO_MIGRATE=false to opt out and manage the schema yourself.
 */
@Injectable()
export class SchemaMigratorService implements OnModuleInit {
  private readonly logger = new Logger(SchemaMigratorService.name);

  constructor(
    @InjectDataSource() private dataSource: DataSource,
    private configService: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    if (this.configService.get<string>('AUTO_MIGRATE') === 'false') {
      this.logger.log('AUTO_MIGRATE=false — şema migration atlandı');
      return;
    }

    await this.apply([...BILLING_SCHEMA_001]);
  }

  async apply(statements: SchemaStatement[]): Promise<void> {
    const runner = this.dataSource.createQueryRunner();
    await runner.connect();

    let applied = 0;
    let skipped = 0;

    try {
      // Serialise across processes: the API and worker boot at the same time.
      await runner.query('SELECT pg_advisory_lock($1)', [ADVISORY_LOCK_KEY]);

      for (const statement of statements) {
        try {
          await runner.query(statement.sql);
          applied++;
        } catch (error) {
          const message = (error as Error).message;
          if (statement.optional) {
            skipped++;
          } else {
            // Keep booting: a half-applied schema with a loud log is easier to
            // diagnose than a restart loop, and the failure is already visible
            // on the affected queries.
            this.logger.error(
              `Şema adımı başarısız: ${this.describe(statement.sql)} — ${message}`,
            );
          }
        }
      }
    } catch (error) {
      this.logger.error(`Şema migration çalıştırılamadı: ${(error as Error).message}`);
    } finally {
      await runner
        .query('SELECT pg_advisory_unlock($1)', [ADVISORY_LOCK_KEY])
        .catch(() => undefined);
      await runner.release();
    }

    if (applied > 0 || skipped > 0) {
      this.logger.log(`Şema güncel (${applied} uygulandı, ${skipped} atlandı)`);
    }
  }

  private describe(sql: string): string {
    return sql.replace(/\s+/g, ' ').trim().slice(0, 80);
  }
}
