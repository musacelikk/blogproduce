/**
 * Applies scripts/migrations/001-billing-schema.sql against the configured
 * database, so you do not need psql on the deploy host:
 *
 *   npm run migrate:billing
 *
 * The SQL is additive and idempotent — re-running it is safe.
 */
import { config as loadEnv } from 'dotenv';
import { Client } from 'pg';
import { readFileSync } from 'fs';
import { join } from 'path';

loadEnv();

interface Step {
  sql: string;
  /** Marked `--#?`: failure is expected on a re-run or unsupported server. */
  optional: boolean;
}

function connectionConfig() {
  const url = process.env.DATABASE_URL;
  const useSsl = process.env.NODE_ENV === 'production' || process.env.DB_SSL === 'true';
  const ssl = useSsl ? { rejectUnauthorized: false } : undefined;

  if (url) return { connectionString: url, ssl };

  return {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'railway',
    ssl,
  };
}

/** Split on `--#` / `--#?`, keeping each statement's optional flag. */
function parseSteps(sql: string): Step[] {
  const steps: Step[] = [];
  let buffer: string[] = [];

  const flush = (optional: boolean) => {
    const body = buffer.join('\n').trim();
    buffer = [];
    // Skip comment-only chunks (the file header).
    if (body && body.split('\n').some((l) => l.trim() && !l.trim().startsWith('--'))) {
      steps.push({ sql: body, optional });
    }
  };

  for (const line of sql.split('\n')) {
    const marker = line.trim();
    if (marker === '--#' || marker === '--#?') {
      flush(marker === '--#?');
    } else {
      buffer.push(line);
    }
  }
  flush(false);

  return steps;
}

/** First non-comment line, for progress output. */
function describe(sql: string): string {
  const line = sql.split('\n').find((l) => l.trim() && !l.trim().startsWith('--')) ?? sql;
  return line.trim().slice(0, 64);
}

async function run() {
  const sqlPath = join(__dirname, 'migrations', '001-billing-schema.sql');
  const steps = parseSteps(readFileSync(sqlPath, 'utf-8'));

  const client = new Client(connectionConfig());
  await client.connect();

  console.log(`\nBilling şema migration'ı çalışıyor (${steps.length} adım)…\n`);

  let applied = 0;
  let skipped = 0;
  let failed = false;

  for (const [index, step] of steps.entries()) {
    const prefix = `  ${String(index + 1).padStart(2)}/${steps.length}`;
    try {
      await client.query(step.sql);
      applied++;
      console.log(`${prefix} ✓ ${describe(step.sql)}`);
    } catch (error) {
      const message = (error as Error).message;
      if (step.optional) {
        skipped++;
        console.log(`${prefix} – ${describe(step.sql)}  (atlandı: ${message})`);
      } else {
        failed = true;
        console.error(`${prefix} ✗ ${describe(step.sql)}\n      ${message}`);
        break;
      }
    }
  }

  await client.end();

  if (failed) {
    console.error('\nMigration başarısız. Hiçbir veri silinmedi; hatayı giderip tekrar çalıştırın.\n');
    process.exitCode = 1;
    return;
  }

  console.log(`\nŞema güncel (${applied} uygulandı, ${skipped} atlandı).`);
  console.log('Sırada: npm run seed:catalog\n');
}

run().catch((error) => {
  console.error('Migration çalıştırılamadı:', error);
  process.exit(1);
});
