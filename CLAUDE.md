# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

The repo is a two-package monorepo with no workspace tooling — run commands from `backend/` or `frontend/`.

```bash
# Backend (NestJS, port 3001)
cd backend
npm run start:dev                  # watch mode
npm run build                      # nest build -p tsconfig.build.json → dist/main.js
npm run lint                       # eslint --fix
npm test                           # jest (testRegex: .*\.spec\.ts$, rootDir: src)
npm test -- path/to/file.spec.ts   # single test file
npm test -- -t "test name"         # single test by name
npm run test:e2e                   # jest --config ./test/jest-e2e.json
npm run worker                     # SQS consumer (ts-node)
npm run create-admin               # seeds admin from ADMIN_EMAIL/ADMIN_PASSWORD/ADMIN_NAME
npm run migrate:billing            # applies schema migrations by hand (they also run at boot)
npm run seed:catalog               # upserts plans + token packs from src/billing/plan-catalog.ts

# Frontend (Next.js 14 app router, port 3000)
cd frontend
npm run dev
npm run build
npm run lint
npx tsc --noEmit                   # typecheck only
```

**Production runs two processes** from the same build: `npm run start:api` (HTTP) and `npm run start:worker` (SQS consumer). Both are defined in the root `package.json`, which builds only the backend — the frontend deploys separately.

**Schema changes apply at boot, not by hand.** `synchronize` is off in production, so
`SchemaMigratorService` (`src/database/`) runs the statement lists in `src/database/migrations/`
on every startup, serialised across processes with a Postgres advisory lock. Adding a column to an
entity **must** come with a statement there: TypeORM selects all mapped columns, so a missing one
breaks *every* query against that table — a new `users` column takes down login and registration,
far from the feature you were building.

Migrations are TypeScript, not `.sql`, so they ship inside `dist` without an asset-copying step.
Keep every statement additive and idempotent (`IF NOT EXISTS`), and mark anything that legitimately
fails on a re-run — `CREATE TYPE`, `CREATE EXTENSION` — as `optional: true`.

`tsconfig.build.json` restricts compilation to `src/`. Without it, `backend/scripts/` is also compiled, TypeScript preserves the common root, and the entrypoints move to `dist/src/main.js` — silently breaking `start:prod`. If you add a top-level directory that should ship, extend that file rather than the base `tsconfig.json`.

Required env: `backend/.env` needs `DATABASE_URL` (or `DB_*`), `JWT_SECRET`, `OPENAI_API_KEY`, and the `SQS_*` queue URLs plus AWS credentials for generation to work end-to-end. `ANTHROPIC_API_KEY` is optional — it enables the premium (Claude) tier. `frontend/.env` needs `NEXT_PUBLIC_API_URL`.

## Architecture

### Content generation is asynchronous and spans two processes

A generation request never produces content in the HTTP response. The flow is:

1. **API process** creates a `Post` (status `QUEUED`) + a `GenerationJob` row, sends a `GENERATE_POST` message to SQS, returns a `jobId` immediately (`api.service.ts` for partner API, `posts.service.ts` for the dashboard).
2. **Worker process** (`worker/worker.service.ts`) long-polls SQS, calls the AI pipeline, writes a new `PostRevision`, and moves the post to `DRAFT`.
3. Client polls `GET /api/v1/jobs/:jobId` until `succeeded`, then publishes.

Both processes bootstrap the **full `AppModule`** (`worker.main.ts` uses `createApplicationContext`), so anything registered globally — including `@nestjs/schedule` crons — runs in both. Scheduled work must therefore claim its rows atomically (see `publishScheduledPosts`), or it executes twice.

**SQS owns retry accounting.** The worker never re-enqueues: a transient failure is signalled by *not* deleting the message, letting the visibility timeout redeliver it. `classifyError()` decides retryable vs terminal, and `ApproximateReceiveCount` (requested via `MessageSystemAttributeNames`) is the attempt counter. `claimPost()` moves the post to `GENERATING` with a conditional UPDATE that doubles as the idempotency lock and reclaims leases older than `WORKER_JOB_TIMEOUT_MS` from crashed workers.

### AI pipeline (`backend/src/ai/`)

`BlogGeneratorService` runs a three-stage pipeline: **outline → draft → polish**. Stage 1 and 3 are non-fatal (failures degrade to the previous stage's output). The draft and polish stages are schema-enforced against `blog-content.schema.ts`, which is written to satisfy *both* OpenAI strict `json_schema` and Anthropic structured outputs — every object needs `additionalProperties: false` and all properties in `required`.

`LlmService` is the provider gateway. Routing rule: **model ids starting with `claude` go to Anthropic, everything else to OpenAI.** `resolveModel()` maps a tier name to a model by reading `billing/model-tiers.ts` — it does not carry its own table, so pricing and generation cannot disagree about what "premium" means. If a provider's API key is missing the tier degrades to the other provider rather than failing. Anthropic calls set `fallbacks: "default"` so classifier refusals re-run server-side; a surviving refusal throws `LlmRefusalError`.

Two Anthropic-specific constraints are baked into `completeAnthropic()` and easy to reintroduce by accident: **`temperature` is rejected** by Claude 5 models, and **thinking is on by default and shares the `max_tokens` budget** with the response — which is why Anthropic requests get 32K while OpenAI gets 16K. Depth is controlled with `output_config.effort`, not a token budget.

Prompts live in `blog-prompts.ts` and are the main lever on output quality — the writer persona, the anti-cliché rules, and the editor checklist are all there rather than scattered across services.

### Billing (`backend/src/billing/`)

**Two currencies, and they must never be added together.** Customers pay in **TRY**; OpenAI and
Anthropic bill us in **USD**. Every money field carries its unit in the name (`priceTry`,
`costAtFullUsageUsd`), and `currency.ts` is the only place the two meet — it holds the
`USD_TRY_RATE` conversion and `grossMarginPct(revenueTry, costUsd)`. Subtracting a USD cost from a
TRY price without converting yields a margin roughly 40x too good, which is exactly the kind of
error that reads as success.

Four files hold the entire commercial model, and everything else reads from them:

- **`model-tiers.ts`** — the quality tiers customers buy, provider rate cards, and the cost maths.
  Tier→model is **configurable per environment** (`TIER_MODEL_STANDARD/PRO/PREMIUM`); the defaults
  are OpenAI-only (`gpt-4o-mini` / `gpt-4o` / `gpt-4.1`) because the Anthropic key is not connected
  yet, and a tier pointing at an unconfigured provider degrades silently — a customer would pay for
  the top tier and get standard quality with only a log line. Pricing and `reasoningFactor` are
  derived from the resolved model, so an override can never leave billing out of step with what
  actually ran. `reasoningFactor` exists because Claude bills thinking tokens as output.
  Note the tiers are **not** monotonic in cost: `gpt-4.1` (premium) is both better and cheaper than
  `gpt-4o` (pro). That is not a bug — don't "fix" it by reordering.
- **`currency.ts`** — the TRY/USD boundary described above.
- **`plan-catalog.ts`** — plan and token-pack blueprints in TRY (the seed source of truth), plus the
  margin helpers. `npm run seed:catalog` upserts them by `key`.
- **`billing.service.ts`** — `getEntitlement()` is the one answer to "what may this user do right
  now"; `authorizeGeneration()` is the gate every generation passes through.

The money flow: a plan grants a **monthly token allowance** that resets each calendar month;
pay-as-you-go top-ups land in `users.token_balance` and are spent **only after** the allowance is
exhausted, so a top-up is never wasted on a light month. `settleTokenBalance()` draws down that
balance after usage is recorded — the `usage_ledger` stays the source of truth for what was
consumed, the balance is derived.

Every new signup gets a 7-day trial (`users.trial_ends_at`, started in `AuthService.register`).
An expired plan keeps its tier permissions but grants no fresh allowance, so a lapsed user can
still spend top-up tokens they already paid for.

**Payment is bank transfer (havale/EFT), which has no callback.** There is no card gateway; money
arrives as a line on a bank statement. So the flow is two-phase and the split is load-bearing:
`createPaymentRequest()` opens a `pending` row in `payments` with a unique `referenceCode` and
**grants nothing**, and `confirmPayment()` — admin-only — is the single place fulfilment happens
(credit tokens, or activate the subscription). Never fulfil on row creation. Confirmation uses a
conditional UPDATE off `pending` rather than read-then-write, so two admins confirming the same
transfer cannot both credit it. Bank details come from env (`BANK_IBAN`, `BANK_NAME`,
`BANK_ACCOUNT_HOLDER`), not the database, and orders are refused outright when they are unset
rather than quoting a blank IBAN.

`CostAnalysisService` powers the admin cost calculator: projected per-plan margins at full
allowance usage, observed per-model spend from real revisions, and a what-if endpoint for pricing
a plan before creating it. **Plan prices are editable in the admin panel** — the blueprints are
the fresh-install defaults, and re-running the seeder overwrites admin edits. When adding a figure
to `getActuals()`, scope it to the selected month on *both* sides: revenue is filtered to
subscriptions live during that month precisely so a historical margin compares like with like.

Tests in `billing.service.spec.ts` assert the economics rather than the plumbing: every paid plan
must stay above a 60% gross margin at 100% allowance usage, and token packs must sell above cost
on every tier. Those are the assertions that break if someone edits a price carelessly.

### Image uploads (`backend/src/assets/`, `backend/src/storage/`)

`POST /assets/upload` (multipart, JWT) → S3 → an `assets` row with dimensions from `sharp`.

**The claimed `Content-Type` is not trusted.** `file-type.util.ts` reads magic bytes and the
controller overwrites `file.mimetype` with what it finds; a mismatch is a 400. SVG is refused
outright — it is XML that can carry `<script>`, so an SVG served from the asset domain is stored
XSS. The S3 key is a uuid, never the uploaded filename, which is attacker-controlled.

Two deployment traps this code works around, both of which look like "uploads are broken":

- **ACLs.** Buckets created after April 2023 default to `BucketOwnerEnforced`, where `PutObject`
  carrying an ACL fails with `AccessControlListNotSupported`. So no ACL is sent unless `AWS_S3_ACL`
  is set, and a rejection auto-retries without it. Public read comes from a bucket policy.
- **next/image host allow-list.** An image on a host missing from `remotePatterns` in
  `next.config.js` renders as a 400, not a broken URL. S3 and CloudFront wildcards are listed;
  a custom asset domain needs `NEXT_PUBLIC_ASSET_HOST`.

### Multi-tenancy: Workspace vs Organization/Project

This is the codebase's biggest trap. There are **two parallel tenancy models**:

- **Dashboard/JWT surface** scopes by `workspaceId` (user-facing concept).
- **Partner API/API-key surface** scopes by `organizationId` + `projectId`.

They are bridged lazily: `createApiKey` and the generate flow auto-create an `Organization` named `` `${workspace.name} (${workspace.id})` `` and a `Project` whose **`slug` is the workspace id**. Any code that looks up the org/project for a workspace must use that exact naming convention, or it will silently create a second org and read an empty result set. `BlogService.getUserOrganizationAndProject()` is the canonical implementation.

### Content storage and formats

Post content lives in `PostRevision` rows (versioned, `editor: AI|HUMAN`), never on the post itself. The canonical stored format is **JSON** — `{ content: "<markdown>", metadata: { toc, faq, seo } }`. `common/utils/content-format.util.ts` converts to `md`/`html` on read; API endpoints expose this via `?format=`. `content_html` is always sanitized through `HtmlSanitizerService` before leaving the backend.

`getPublishedRevision()` (`common/utils/revision.util.ts`) picks which revision is live — don't reach for `revisions[0]`.

Markdown → HTML goes through `marked` (`markdown-to-html.util.ts`). **Keep it on the v4 line**: v12+ is ESM-only, and `require()`-ing it crashes the backend at startup on Node 18/20 even though it happens to work on Node 22+.

### Auth surfaces

Three distinct mechanisms, each with its own guard:

- `JwtAuthGuard` — dashboard/admin. Any **admin-scope** operation additionally needs `RolesGuard` + `@Roles(UserRole.ADMIN)`; a bare `JwtAuthGuard` only proves *someone* is logged in. This applies beyond `AdminController` — FAQ writes, contact-inbox reads and notification broadcast are all admin-only. Individual routes opt back out with `@Public()` (both `JwtAuthGuard` and `RolesGuard` honour it), which is how `AdminController` keeps `plans/public`, `homepage/posts/public` and the two tracking endpoints anonymous under a controller-level guard.
- `ApiKeyGuard` — partner API (`/api/v1/*`). Accepts `Authorization: Bearer bg_secret_…` or `X-API-Key`. Attaches `request.organization`/`request.project`, read via the `@CurrentOrganization()` / `@CurrentProject()` decorators.
- `ApiKeyOrJwtGuard` — the legacy `/v1/api/blog` and `/api/blog` read endpoints, which serve both dashboard and API-key callers.

The `PublicApiController` (`/api/v1/public/projects/…`) has **no guard** by design — it serves published content for client-side rendering. Never add fields there that aren't safe for anonymous consumption.

### Frontend

Next.js app router with three shells distinguished by `data-*` attributes on the page root (`data-admin-page`, `data-dashboard-page`, `data-login-page`); `globals.css` hides the public navbar/footer based on them. `middleware.ts` additionally maps the `admin.` subdomain onto `/admin/*` routes in production.

`lib/api.ts` is the single API client — it owns token refresh (single-flight) and the `{success, data}` envelope unwrapping. Design tokens are CSS variables in `app/globals.css` consumed by `tailwind.config.ts` as **plain values, not `hsl()` wrappers** (`var(--primary)`, not `hsl(var(--primary))`). Shared primitives in `components/ui/` (Button, Card, Badge, Table, PageHeader, StatCard, EmptyState) — prefer them over hand-rolled markup, and use token classes (`bg-card`, `text-muted-foreground`) rather than hardcoded colors.

## Conventions

- Response envelope on API-facing controllers is hand-written per handler: `{ success: true, data }`. There is no global transform interceptor, so new endpoints must include it explicitly to stay consistent.
- Cursor pagination uses `encodeCursor`/`decodeCursor` (`common/utils/cursor.util.ts`) with a **(timestamp, id) composite** predicate — a timestamp-only cursor drops rows on ties.
- User-facing error messages are Turkish; code comments and API documentation are English.
