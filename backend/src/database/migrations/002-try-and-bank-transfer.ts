import { SchemaStatement } from '../schema-migrator.service';

/**
 * Switch pricing to Turkish lira and add the bank-transfer (havale/EFT) inbox.
 *
 * Two rules this migration follows, same as 001: every statement is additive and
 * idempotent, and nothing is dropped. The old `price_usd` / `amount_usd` columns
 * survive as history — they are only relaxed to nullable so new TRY-only rows
 * can be written. Backfills are guarded by `WHERE ... IS NULL`, so a re-run
 * cannot double-convert an amount.
 *
 * The USD→TRY rate below is fixed at 42 deliberately: it converts the seed
 * catalog *once*, and after that prices are TRY values that stand on their own.
 * Live rate changes belong in `USD_TRY_RATE` (margin reporting), not here —
 * re-converting historical rows would rewrite what customers actually paid.
 */
const SEED_CONVERSION_RATE = 42;

export const TRY_AND_BANK_TRANSFER_002: SchemaStatement[] = [
  // ── token_packs: price in TRY ──────────────────────────────────────────
  {
    sql: `ALTER TABLE token_packs ADD COLUMN IF NOT EXISTS price_try numeric(12, 2) NULL`,
  },
  {
    sql: `UPDATE token_packs SET price_try = ROUND(price_usd * ${SEED_CONVERSION_RATE}, 2)
          WHERE price_try IS NULL AND price_usd IS NOT NULL`,
  },
  { sql: `ALTER TABLE token_packs ALTER COLUMN price_usd DROP NOT NULL` },

  // ── token_purchases: amount in TRY ─────────────────────────────────────
  {
    sql: `ALTER TABLE token_purchases ADD COLUMN IF NOT EXISTS amount_try numeric(12, 2) NULL`,
  },
  {
    sql: `UPDATE token_purchases SET amount_try = ROUND(amount_usd * ${SEED_CONVERSION_RATE}, 2)
          WHERE amount_try IS NULL AND amount_usd IS NOT NULL`,
  },
  { sql: `ALTER TABLE token_purchases ALTER COLUMN amount_usd DROP NOT NULL` },

  // ── payments: the bank-transfer inbox ──────────────────────────────────
  // `payments` already existed as the sales ledger with a `bank_transfer`
  // method, so confirmed transfers land in admin reporting for free.
  {
    sql: `ALTER TABLE payments ADD COLUMN IF NOT EXISTS reference_code varchar(32) NULL`,
  },
  {
    // Partial index: only one *live* code matters, and historical NULLs must not
    // collide with each other.
    sql: `CREATE UNIQUE INDEX IF NOT EXISTS payments_reference_code_unique
          ON payments (reference_code) WHERE reference_code IS NOT NULL`,
  },
  {
    sql: `ALTER TABLE payments ADD COLUMN IF NOT EXISTS token_pack_id uuid NULL
          REFERENCES token_packs (id)`,
  },
  { sql: `ALTER TABLE payments ADD COLUMN IF NOT EXISTS tokens bigint NULL` },
  { sql: `ALTER TABLE payments ADD COLUMN IF NOT EXISTS billing_period varchar(16) NULL` },
  { sql: `ALTER TABLE payments ADD COLUMN IF NOT EXISTS reviewed_by_id uuid NULL` },
  { sql: `ALTER TABLE payments ADD COLUMN IF NOT EXISTS reviewed_at timestamp NULL` },
  {
    // The admin inbox query is "pending, newest first".
    // `payments` was created by TypeORM's default naming strategy, which leaves
    // @CreateDateColumn as camelCase — hence the quotes. Other tables in this
    // schema *are* snake_case, so never assume; check the entity.
    sql: `CREATE INDEX IF NOT EXISTS idx_payments_status_created
          ON payments (status, "createdAt" DESC)`,
    optional: true,
  },
  {
    // Existing rows predate the currency switch and were priced in USD; only the
    // column default changes for new rows.
    sql: `ALTER TABLE payments ALTER COLUMN currency SET DEFAULT 'TRY'`,
  },

  // ── plan_definitions: record which currency a plan's price is in ───────
  // Prices live in a jsonb blob, so without this an admin editing a plan cannot
  // tell whether `price.monthly` is 49 dollars or 49 lira.
  {
    sql: `ALTER TABLE plan_definitions ADD COLUMN IF NOT EXISTS currency varchar(3) NOT NULL DEFAULT 'TRY'`,
  },
];
