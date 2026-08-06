import { SchemaStatement } from '../schema-migrator.service';

/**
 * Billing schema: free trial, pay-as-you-go token balance, token packs.
 *
 * Written as TypeScript rather than a .sql file so it ships inside `dist` with
 * no asset-copying step — a migration that fails to deploy is worse than none.
 *
 * Every statement is additive and idempotent: nothing is dropped or retyped, so
 * running this on every boot costs one cheap no-op round trip per statement.
 *
 * The rest of the schema was created by TypeORM, whose uuid primary keys default
 * to `uuid_generate_v4()` from uuid-ossp — the new tables use the same function
 * to keep one convention across the database.
 */
export const BILLING_SCHEMA_001: SchemaStatement[] = [
  // Whichever uuid extension is already present is enough; on Postgres 13+
  // neither is required. Optional so a locked-down host cannot block the rest.
  { sql: `CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`, optional: true },
  { sql: `CREATE EXTENSION IF NOT EXISTS pgcrypto`, optional: true },

  // ── users: trial window + purchased token balance ──────────────────────
  { sql: `ALTER TABLE users ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz NULL` },
  { sql: `ALTER TABLE users ADD COLUMN IF NOT EXISTS token_balance bigint NOT NULL DEFAULT 0` },

  // ── plan_definitions: catalog key + trial length ───────────────────────
  { sql: `ALTER TABLE plan_definitions ADD COLUMN IF NOT EXISTS key varchar NULL` },
  { sql: `ALTER TABLE plan_definitions ADD COLUMN IF NOT EXISTS trial_days integer NULL` },
  {
    // A unique index, not ADD CONSTRAINT: only the index form supports IF NOT EXISTS.
    sql: `CREATE UNIQUE INDEX IF NOT EXISTS plan_definitions_key_unique ON plan_definitions (key)`,
  },
  {
    // Optional: harmless when the value exists, skipped when level is not an enum.
    sql: `ALTER TYPE plan_definitions_level_enum ADD VALUE IF NOT EXISTS 'trial'`,
    optional: true,
  },

  // ── token_packs: the pay-as-you-go catalog ─────────────────────────────
  {
    sql: `CREATE TABLE IF NOT EXISTS token_packs (
      id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
      key         varchar NOT NULL UNIQUE,
      name        varchar NOT NULL,
      tokens      bigint NOT NULL,
      price_usd   numeric(10, 2) NOT NULL,
      popular     boolean NOT NULL DEFAULT false,
      active      boolean NOT NULL DEFAULT true,
      sort_order  integer NOT NULL DEFAULT 0,
      created_at  timestamp NOT NULL DEFAULT now(),
      updated_at  timestamp NOT NULL DEFAULT now()
    )`,
  },

  // ── token_purchases: the ledger behind users.token_balance ─────────────
  {
    // CREATE TYPE has no IF NOT EXISTS, so a re-run is expected to fail here.
    sql: `CREATE TYPE token_purchases_status_enum AS ENUM ('pending', 'completed', 'refunded')`,
    optional: true,
  },
  {
    sql: `CREATE TABLE IF NOT EXISTS token_purchases (
      id             uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id        uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
      token_pack_id  uuid NULL REFERENCES token_packs (id),
      tokens         bigint NOT NULL,
      amount_usd     numeric(10, 2) NOT NULL,
      status         token_purchases_status_enum NOT NULL DEFAULT 'completed',
      note           text NULL,
      created_at     timestamp NOT NULL DEFAULT now()
    )`,
  },
  {
    sql: `CREATE INDEX IF NOT EXISTS idx_token_purchases_user_created
          ON token_purchases (user_id, created_at)`,
  },
];
