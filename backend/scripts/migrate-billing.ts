/**
 * Applies the schema migrations by hand:
 *
 *   npm run migrate:billing
 *
 * Normally unnecessary — the app applies them itself at boot (see
 * src/database/schema-migrator.service.ts). This exists for the cases where you
 * want to run them ahead of a deploy, or with AUTO_MIGRATE=false.
 *
 * It reuses the same statement list as the boot-time migrator, so the two can
 * never drift apart.
 */
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { SchemaMigratorService, ALL_MIGRATIONS } from '../src/database/schema-migrator.service';

async function run() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    // Booting AppModule already ran the migrator once; this makes the manual
    // invocation explicit and reports the outcome.
    await app.get(SchemaMigratorService).apply(ALL_MIGRATIONS);
    console.log('\nŞema güncel. Sırada: npm run seed:catalog\n');
  } catch (error) {
    console.error('\nMigration başarısız:', (error as Error).message);
    process.exitCode = 1;
  } finally {
    await app.close();
  }
}

run().catch((error) => {
  console.error('Migration çalıştırılamadı:', error);
  process.exit(1);
});
