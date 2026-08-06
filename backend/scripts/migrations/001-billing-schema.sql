-- Billing schema: free trial, pay-as-you-go token balance, token packs.
--
-- Additive and idempotent — safe to re-run, and it never drops or retypes an
-- existing column. Run once per environment after deploying the release that
-- introduced backend/src/billing/.
--
--   npm run migrate:billing          (uses DATABASE_URL / DB_* from .env)
--   psql "$DATABASE_URL" -f scripts/migrations/001-billing-schema.sql
--
-- Statements are separated by a line containing only `--#`, or `--#?` when the
-- statement is allowed to fail (it already exists, or the server does not need
-- it). Deliberately plain SQL — no DO/plpgsql blocks — so it runs anywhere.

-- The rest of this schema was created by TypeORM, whose uuid primary keys default
-- to uuid_generate_v4() from uuid-ossp — so the new tables use the same function
-- rather than gen_random_uuid(), keeping one convention across the database.
-- Both extension steps are optional: whichever is already present is enough.
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
--#?
CREATE EXTENSION IF NOT EXISTS pgcrypto;
--#?

-- ── users: trial window + purchased token balance ────────────────────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz NULL;
--#
ALTER TABLE users ADD COLUMN IF NOT EXISTS token_balance bigint NOT NULL DEFAULT 0;
--#

-- ── plan_definitions: catalog key + trial length ─────────────────────────
ALTER TABLE plan_definitions ADD COLUMN IF NOT EXISTS key varchar NULL;
--#
ALTER TABLE plan_definitions ADD COLUMN IF NOT EXISTS trial_days integer NULL;
--#
-- A unique index, not ADD CONSTRAINT: only the index form supports IF NOT EXISTS.
CREATE UNIQUE INDEX IF NOT EXISTS plan_definitions_key_unique
  ON plan_definitions (key);
--#

-- The trial plan needs a new value on the level enum. Optional: harmless if the
-- value exists, and skipped when the column is not an enum type.
ALTER TYPE plan_definitions_level_enum ADD VALUE IF NOT EXISTS 'trial';
--#?

-- ── token_packs: the pay-as-you-go catalog ───────────────────────────────
CREATE TABLE IF NOT EXISTS token_packs (
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
);
--#

-- ── token_purchases: the ledger behind users.token_balance ───────────────
-- Optional: CREATE TYPE has no IF NOT EXISTS, so a re-run is expected to fail here.
CREATE TYPE token_purchases_status_enum AS ENUM ('pending', 'completed', 'refunded');
--#?

CREATE TABLE IF NOT EXISTS token_purchases (
  id             uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  token_pack_id  uuid NULL REFERENCES token_packs (id),
  tokens         bigint NOT NULL,
  amount_usd     numeric(10, 2) NOT NULL,
  status         token_purchases_status_enum NOT NULL DEFAULT 'completed',
  note           text NULL,
  created_at     timestamp NOT NULL DEFAULT now()
);
--#

CREATE INDEX IF NOT EXISTS idx_token_purchases_user_created
  ON token_purchases (user_id, created_at);
