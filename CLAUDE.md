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

`AUTOPILOT_ENABLED=false` stops every autopilot config at once; anything else (including unset)
leaves autopilot running, though each config still defaults to `enabled = false`.

**Hosting cost levers.** Both processes are billed on observed memory, so:

- **The heap cap is baked into the entrypoints**, not left to a dashboard variable:
  `start:prod` and `worker:prod` pass `--max-old-space-size=${NODE_HEAP_MB:-320}` (384 for the
  worker, which holds larger AI responses). Unflagged, V8 grants itself a ~2240MB ceiling on this
  hardware and defers GC accordingly; the flag takes that to ~512MB, which is what actually lowers
  billed RSS. Override per service with `NODE_HEAP_MB` — but raise it rather than lower it blindly,
  since too low a cap trades a memory bill for OOM restarts.
- **The connection pool is sized per process** (`POOL_SIZE` in `database/typeorm.config.ts`): 10 for
  the API, 3 for the worker, which handles one SQS message at a time and spends most of each job
  awaiting a provider. `buildTypeOrmOptions(config, 'worker')` selects it, and `role` sizes *only*
  the pool — the entity list must stay identical between the two.
- `npm run build:slim` in place of `npm run build` drops ~155MB of build tooling from the image.
  It also removes `ts-node`, so `create-admin`, `seed:catalog` and `migrate:billing` stop working
  on that box until dev dependencies are reinstalled — only use it if those are run elsewhere.
- The Node major is pinned in `engines` (`20.x`). Don't unpin it: `marked` must stay on v4 because
  v12+ is ESM-only and `require()`-ing it crashes the backend at startup on Node 18/20.

## Architecture

### Content generation is asynchronous and spans two processes

A generation request never produces content in the HTTP response. The flow is:

1. **API process** creates a `Post` (status `QUEUED`) + a `GenerationJob` row, sends a `GENERATE_POST` message to SQS, returns a `jobId` immediately (`api.service.ts` for partner API, `posts.service.ts` for the dashboard).
2. **Worker process** (`worker/worker.service.ts`) long-polls SQS, calls the AI pipeline, writes a new `PostRevision`, and moves the post to `DRAFT`.
3. Client polls `GET /api/v1/jobs/:jobId` until `succeeded`, then publishes.

The two processes have **separate root modules**. `main.ts` boots `AppModule`; `worker.main.ts` boots
`WorkerAppModule` (`worker/worker-app.module.ts`), which is only Config + TypeORM + `DatabaseModule`
+ `WorkerModule`. The worker previously bootstrapped the full `AppModule`, so a process that merely
consumes SQS also constructed every controller, guard, passport strategy, interceptor and Express
itself — roughly 27MB resident for code it could never reach.

Both share one connection factory, `database/typeorm.config.ts`: `ALL_ENTITIES` plus
`buildTypeOrmOptions()`. **Add a new entity there, not to a module.** TypeORM selects all mapped
columns, so an entity missing from the list a process boots with breaks every query against that
table — and two hand-maintained copies is how that happens.

Crons therefore now run **only in the API process**. Scheduled work must still claim its rows
atomically (see `publishScheduledPosts`, `AutopilotService.runDue`): correctness never depended on
the module layout, and the API itself may run more than one instance.

**SQS owns retry accounting.** The worker never re-enqueues: a transient failure is signalled by *not* deleting the message, letting the visibility timeout redeliver it. `classifyError()` decides retryable vs terminal, and `ApproximateReceiveCount` (requested via `MessageSystemAttributeNames`) is the attempt counter. `claimPost()` moves the post to `GENERATING` with a conditional UPDATE that doubles as the idempotency lock and reclaims leases older than `WORKER_JOB_TIMEOUT_MS` from crashed workers.

### AI pipeline (`backend/src/ai/`)

`BlogGeneratorService` runs a three-stage pipeline: **outline → draft → polish**. Stage 1 and 3 are non-fatal (failures degrade to the previous stage's output). The draft and polish stages are schema-enforced against `blog-content.schema.ts`, which is written to satisfy *both* OpenAI strict `json_schema` and Anthropic structured outputs — every object needs `additionalProperties: false` and all properties in `required`.

`LlmService` is the provider gateway. Routing rule: **model ids starting with `claude` go to Anthropic, everything else to OpenAI.** `resolveModel()` maps a tier name to a model by reading `billing/model-tiers.ts` — it does not carry its own table, so pricing and generation cannot disagree about what "premium" means. If a provider's API key is missing the tier degrades to the other provider rather than failing. Anthropic calls set `fallbacks: "default"` so classifier refusals re-run server-side; a surviving refusal throws `LlmRefusalError`.

Two Anthropic-specific constraints are baked into `completeAnthropic()` and easy to reintroduce by accident: **`temperature` is rejected** by Claude 5 models, and **thinking is on by default and shares the `max_tokens` budget** with the response — which is why Anthropic requests get 32K while OpenAI gets 16K. Depth is controlled with `output_config.effort`, not a token budget.

**Internal links are written by the model, not inserted afterwards.** The worker resolves the
site's recently published posts (`findRelatedPosts`, scoped to `workspaceId`) and passes them as
`relatedPosts`; `buildWriterSystemPrompt` then asks for two or three contextual links. Resolving it
in the worker rather than threading it through the SQS message means every generation path — the
dashboard, the partner API and autopilot — gets links without widening the message contract, and
in-flight messages from an older deploy keep working. The rule is in the shared writer prompt, so
the editor pass cannot strip the links back out.

**Stage reporting is advisory.** `BlogGenerationRequest.onStage` fires as each stage begins and the
worker writes it to `generation_jobs.stage`, which `GET /jobs/:jobId` exposes. Only stages that
actually run are reported — standard tier skips the editor pass — so a client must not assume a
fixed sequence, and a progress display must not promise a step that will never arrive. A throwing
callback is swallowed: progress must never cost an article the customer was billed for.

Prompts live in `blog-prompts.ts` and are the main lever on output quality — the writer persona, the anti-cliché rules, and the editor checklist are all there rather than scattered across services.

### Autopilot (`backend/src/autopilot/`)

End-to-end unattended publishing, configured **per site**: understand the site → plan topics →
generate → publish. One `AutopilotConfig` row per site (`site_id` is unique), and a queue of
`TopicIdea` rows it draws from.

**Topics are planned in batches, never per article.** `TopicPlannerService` asks for ~25 topics in a
single call and the run loop consumes one per tick. This is the subsystem's main cost decision:
planning a batch costs about $0.0014, while a planning call per article would cost over an order of
magnitude more for the same output. The planner is also **pinned to `gpt-4o-mini`** regardless of the
tier the config buys for its articles — `PLANNER_MODEL` in that file, asserted by
`topic-planner.service.spec.ts`. Don't route it through `resolveModel()`; planning quality is not
what customers are paying a tier for.

**Autopilot adds no generation path of its own.** It calls `PostsService.generate()`, so it passes
through the same `authorizeGeneration()` gate, slug uniquing and workspace→org/project bridge as a
dashboard request. A config can therefore never generate beyond the owner's plan.

Three independent spend limits, because cadence alone is not a budget:
- `posts_per_week` spaces runs (`7 / postsPerWeek` days between them).
- `max_posts_per_month` is a hard monthly ceiling. Its counter rolls over against `month_anchor` —
  **check the rollover before the cap**, or a config that once hit the ceiling stays capped forever.
- `AUTOPILOT_ENABLED=false` is the operator kill switch for every config at once.

**A failed run must not consume its topic.** A quota or provider error leaves the idea `planned` and
increments `attempts`, so it is retried; only after `MAX_ENQUEUE_ATTEMPTS` is it rejected, so one
poison topic cannot stall the queue behind it. Burning a topic on a billing error would silently
cost the customer an article they never received.

Articles get a **cover image** from Unsplash, searched with the topic planner's own
`primaryKeyword`. That is why it costs nothing: the alternative, the retired `SeoService`'s
`findCoverImage`, spent a `gpt-4o-mini` call deriving a search phrase autopilot already had. A
missing `UNSPLASH_ACCESS_KEY` makes `searchPhotos` throw, so the lookup is wrapped — an install
without that key still publishes, just without pictures.

`auto_publish` does **not** publish inline. It marks the finished post `SCHEDULED`, handing it to
`publishScheduledPosts` — which already claims each post atomically and fires the `post.published`
webhook. A second publish path would have to reimplement both guarantees. Only a `DRAFT` post is
eligible, so a post still `QUEUED`/`GENERATING`, or one that `FAILED`, is never published.

**Two controllers, two principals.** `AutopilotController` (`/autopilot/*`, `JwtAuthGuard`) checks
the signed-in user against the site's workspace owner. `AutopilotApiController` (`/api/v1/sites/*`,
`ApiKeyGuard`) has no user at all — only an organization + project — so it authorizes through
`assertSiteInProject`: the site must live in the workspace the calling project is bridged to via
`project.slug`. That slug is attacker-influenced input, so `resolveWorkspaceId` checks three things
rather than trusting it — the slug has uuid shape, the project belongs to the authenticated
organization, and **the workspace has the same owner as that organization**. The last one is what
makes the boundary local: verifying only that the slug names *some* existing workspace would rest
tenancy on an invariant maintained in three other files, and a future project endpoint accepting a
caller-supplied slug would silently turn that into a cross-tenant read. It fails closed — a missing
owner on either side, or a project resolving to no workspace, is **denied**, never defaulted.
This is the boundary that keeps one customer's key out of another's configuration — don't add an
autopilot route that skips it. Both controllers share the same service cores (`readConfig`,
`writeConfig`, `readTopics`, `planFor`), which take an already-authorized `Site`.

A config written through an API key is billed to the **workspace owner**, not to whoever holds the
key: the key is issued by that owner and spends their plan.

Tests in `autopilot.service.spec.ts` assert the spend guarantees — the monthly cap, the month
rollover, the conditional-UPDATE claim, and that a billing failure does not consume a topic — plus
the tenancy boundary above (cross-tenant reads and writes, a non-uuid slug, and a slug matching no
workspace all have to be refused). `autopilot-api.controller.spec.ts` pins the published route
paths by reflection, since a typo there only shows up as a customer's integration 404ing.

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

`POST /assets/upload` (multipart, JWT) → S3 → an `assets` row with dimensions from `image-size`.

Dimensions are a **header-only** read. This used to go through `sharp`, which pulls in libvips:
~16MB of platform binaries on disk and ~22MB of resident memory in every process that imports it,
to produce two integers. `image-size` parses just the header and covers every format in
`ALLOWED_UPLOAD_MIMES`. Reach for `sharp` again only if actual image *processing* is needed.

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

### Outbound URLs and SSRF (`common/validators/is-public-https-url.validator.ts`)

Webhook URLs are customer-supplied and we connect to them from inside our own network, so they are
guarded in **three layers**. None is sufficient alone; don't drop one because another looks like it
covers the case.

1. **`isPrivateHost`** — the string check. It must understand every spelling of an address the
   *resolver* understands, not just the canonical one. `net.isIP()` rejects `2130706433`,
   `0177.0.0.1` and `0x7f.0.0.1`, but glibc resolves all three to 127.0.0.1 — a check built on
   `isIP` alone concludes "not an IP, therefore a public hostname" and hands the request straight
   through. `parseIpv4Loose` implements the `inet_aton` forms instead, and the function **fails
   closed**.
2. **`assertPublicHttpsUrl`** — called in the service before persisting, on create *and* update.
   The DTO decorators only cover bodies that declare them: `updateWebhook` was typed
   `Partial<CreateWebhookDto>`, which erases to `Object` at runtime, so class-validator validated
   nothing and a webhook could be registered publicly then repointed at cloud metadata. Update now
   has a real `UpdateWebhookDto` class **and** the service-layer assert.
3. **`privateSafeLookup`** — passed as the `lookup` option to `https.request` in
   `webhooks/webhook.service.ts`. For **hostnames** this closes DNS rebinding with no
   time-of-check/time-of-use gap: the address it returns is the one the socket connects to. Node
   skips `lookup` entirely for IP-literal hosts (measured, not assumed), so literals are covered by
   layer 1 instead — they have no DNS step to rebind. The two halves are disjoint; neither may be
   dropped, and `webhook-delivery-guard.spec.ts` fails if the literal half is.

`sendWebhook` drains the response (`res.resume()`) rather than buffering it — the body is a
remote endpoint's to choose and nothing reads it — and carries an absolute `DELIVERY_DEADLINE_MS`
alongside the socket option. `options.timeout` is an *inactivity* timeout, so an endpoint dribbling
a byte every nine seconds would otherwise hold a request open forever; with the old unbounded
buffer that was remote-controlled memory growth. Override the deadline with
`WEBHOOK_DELIVERY_DEADLINE_MS`.

**There is exactly one delivery implementation**, `WebhookService.sendWebhook`. `ApiService` used to
carry a second one built on `fetch`, and the two drifted: only one re-validated the URL, and only
one pinned the resolved address. `ApiService.triggerWebhook` is now a thin delegation that keeps the
old error-swallowing semantics — a customer's broken endpoint must not fail the generation they paid
for. **Don't add a third.** Two delivery paths means two places to get SSRF right.

Adding a new outbound-URL feature means all three layers, not just the decorator — and it goes
through `WebhookService`.

The wire contract customers integrate against — `{ event, timestamp, data }` plus
`X-Webhook-Event` / `X-Webhook-Signature` (HMAC-SHA256 of the **raw body**, hex) /
`X-Webhook-Timestamp` — is documented with working receivers for Next.js, Express and WordPress in
the dashboard's API reference. Changing the payload shape or the header names breaks every
customer's verification silently, since a mismatched signature is indistinguishable from a forged
request. `timestamp` sits **inside** the signed body on purpose: a receiver can check freshness
without trusting an editable header, and every documented receiver does — a valid signature alone
leaves a captured delivery replayable forever. The examples there are syntax-checked, not
eyeballed.

### Multi-tenancy: Workspace vs Organization/Project

This is the codebase's biggest trap. There are **two parallel tenancy models**:

- **Dashboard/JWT surface** scopes by `workspaceId` (user-facing concept).
- **Partner API/API-key surface** scopes by `organizationId` + `projectId`.

They are bridged lazily: `createApiKey` and the generate flow auto-create an `Organization` named `` `${workspace.name} (${workspace.id})` `` and a `Project` whose **`slug` is the workspace id**. Any code that looks up the org/project for a workspace must use that exact naming convention, or it will silently create a second org and read an empty result set. `BlogService.getUserOrganizationAndProject()` is the canonical implementation.

**A post must carry both scopes.** The API used to set only `organizationId`/`projectId`, leaving
`workspace_id` null — and since the dashboard filters on `workspace_id` alone, API-generated posts
were invisible to the user who paid for them. `api.service.ts` now resolves the workspace from
`project.slug` at creation (verifying it against `workspaces` rather than trusting the string), and
migration 003 backfills the rows that predate the fix. Any new write path that creates a post has
to populate both, or it reintroduces exactly this class of bug.

### Content storage and formats

Post content lives in `PostRevision` rows (versioned, `editor: AI|HUMAN`), never on the post itself. The canonical stored format is **JSON** — `{ content: "<markdown>", metadata: { toc, faq, seo } }`. `common/utils/content-format.util.ts` converts to `md`/`html` on read; API endpoints expose this via `?format=`. **`HtmlSanitizerService` is parser-based (`sanitize-html`), and must stay that way.** It used to be
a chain of regex replacements, and its event-handler rule required quoted values — so
`<img src=x onerror=alert(1)>`, the backtick form, a newline before the attribute name and the
uppercase spelling all passed through untouched, while the declared attribute allowlist was never
consulted. The one test that existed used the quoted form, the single case the regex handled.
`html-sanitizer.spec.ts` now carries twenty vectors that all failed against it; a future change to
how HTML is cleaned has to pass every one. `htmlparser2` is pinned to `^9` via `overrides` because
v10+ is ESM-only — the same trap `marked` carries, and it would surface as the backend failing to
boot.

`content_html` is sanitized through `HtmlSanitizerService` before leaving the backend — on **both** read surfaces. `blog.service` always did; `api.service` (`/api/v1/published`, `/api/v1/posts`) did not, and handed `convertContentFormat` output straight out while the docs pointed WordPress receivers at it. Articles are model-written from customer-supplied topics, so the markup is not ours to trust. Any new endpoint returning HTML sanitizes too. `excerpt` goes out through `stripHtml` on the same paths: the schema calls for plain text but nothing enforced it, and receivers put that field straight into a page.

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

`lib/api.ts` is the single API client — it owns token refresh (single-flight, with a one-shot retry on 401). It does **not** unwrap the `{success, data}` envelope: `apiRequest` returns the parsed body as-is, and each wrapper does `response.data || response`, because only some controllers wrap. Follow that per-function pattern rather than unwrapping centrally; a central unwrap would corrupt the responses that are already bare. Design tokens live in `app/globals.css` as **"R G B" channel triplets** (`--primary-rgb: 32 62 236`), with a plain `--primary` derived from each for `var()` consumers. `tailwind.config.ts` maps its colour scale to `rgb(var(--x-rgb) / <alpha-value>)` — that indirection is what makes opacity modifiers (`bg-primary/10`) work, since Tailwind v3 cannot apply an alpha channel to a var holding a literal colour and silently drops the modifier instead. Shared primitives in `components/ui/` (Button, Card, Badge, Table, PageHeader, StatCard, EmptyState) — prefer them over hand-rolled markup, and use token classes (`bg-card`, `text-muted-foreground`) rather than hardcoded colors.

**Dark theme.** `globals.css` carries a `.dark` block that redefines every token as *both* its
"R G B" triplet and its derived literal. The repetition is deliberate: `--primary: rgb(var(--primary-rgb))`
in `:root` is substituted using the triplet as seen on the element where `--primary` is computed, so
redeclaring the literals makes the theme correct wherever the class lands, not only on `<html>`.
`lib/theme.ts` holds the preference (light/dark/system) and exports `THEME_INIT_SCRIPT`, which
`app/layout.tsx` injects into `<head>` — resolving the theme in React would paint light and then
flip. Adding a token means adding it to **both** blocks.

**Marketing visuals are mockups, not screenshots.** `components/sections/mockups/` builds the
product shots on the homepage and `/solutions` out of design tokens. They replaced four PNGs
(~4.9MB) that stayed light in dark mode and went stale whenever the UI moved. Keep them
token-based: a hardcoded colour here is a mockup that will be wrong in one theme.

Autopilot is configured at `/dashboard/autopilot`, which is also the only place a customer can
create a `Site` — the sites API had no UI before it. The page shows a live monthly cost projection
from the selected tier and cadence, capped by the monthly ceiling, so the spend consequence of a
cadence is visible before it is saved.

## Conventions

- Response envelope on API-facing controllers is hand-written per handler: `{ success: true, data }`. There is no global transform interceptor, so new endpoints must include it explicitly to stay consistent.
- Cursor pagination uses `encodeCursor`/`decodeCursor` (`common/utils/cursor.util.ts`) with a **(timestamp, id) composite** predicate — a timestamp-only cursor drops rows on ties.
- User-facing error messages are Turkish; code comments and API documentation are English.
