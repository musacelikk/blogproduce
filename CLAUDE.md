# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

The repo is a two-package monorepo with no workspace tooling — run commands from `backend/` or `frontend/`.

```bash
# Backend (NestJS, port 3001)
cd backend
npm run start:dev                  # watch mode
npm run build                      # npx nest build → dist/
npm run lint                       # eslint --fix
npm test                           # jest (testRegex: .*\.spec\.ts$, rootDir: src)
npm test -- path/to/file.spec.ts   # single test file
npm test -- -t "test name"         # single test by name
npm run test:e2e                   # jest --config ./test/jest-e2e.json
npm run worker                     # SQS consumer (ts-node)
npm run create-admin               # seeds admin from ADMIN_EMAIL/ADMIN_PASSWORD/ADMIN_NAME

# Frontend (Next.js 14 app router, port 3000)
cd frontend
npm run dev
npm run build
npm run lint
npx tsc --noEmit                   # typecheck only
```

**Production runs two processes** from the same build: `npm run start:api` (HTTP) and `npm run start:worker` (SQS consumer). Both are defined in the root `package.json`, which builds only the backend — the frontend deploys separately.

Required env: `backend/.env` needs `DATABASE_URL` (or `DB_*`), `JWT_SECRET`, `OPENAI_API_KEY`, and the `SQS_*` queue URLs plus AWS credentials for generation to work end-to-end. `ANTHROPIC_API_KEY` is optional — it enables the premium (Claude) tier. `frontend/.env` needs `NEXT_PUBLIC_API_URL`.

## Architecture

### Content generation is asynchronous and spans two processes

A generation request never produces content in the HTTP response. The flow is:

1. **API process** creates a `Post` (status `QUEUED`) + a `GenerationJob` row, sends a `GENERATE_POST` message to SQS, returns a `jobId` immediately (`api.service.ts` for partner API, `posts.service.ts` for the dashboard).
2. **Worker process** (`worker/worker.service.ts`) long-polls SQS, calls the AI pipeline, writes a new `PostRevision`, and moves the post to `DRAFT`.
3. Client polls `GET /api/v1/jobs/:jobId` until `succeeded`, then publishes.

Both processes bootstrap the **full `AppModule`** (`worker.main.ts` uses `createApplicationContext`), so anything registered globally — including `@nestjs/schedule` crons — runs in both. Keep that in mind when adding scheduled work.

### AI pipeline (`backend/src/ai/`)

`BlogGeneratorService` runs a three-stage pipeline: **outline → draft → polish**. Stage 1 and 3 are non-fatal (failures degrade to the previous stage's output). The draft and polish stages are schema-enforced against `blog-content.schema.ts`, which is written to satisfy *both* OpenAI strict `json_schema` and Anthropic structured outputs — every object needs `additionalProperties: false` and all properties in `required`.

`LlmService` is the provider gateway. Routing rule: **model ids starting with `claude` go to Anthropic, everything else to OpenAI.** Pricing tiers map in `resolveModel()`: `standard`→`gpt-4.1-mini`, `pro`→`gpt-4.1`, `premium`→`claude-opus-5`. If a provider's API key is missing the tier degrades to the other provider rather than failing. Anthropic calls set `fallbacks: "default"` so classifier refusals re-run server-side; a surviving refusal throws `LlmRefusalError`.

Prompts live in `blog-prompts.ts` and are the main lever on output quality — the writer persona, the anti-cliché rules, and the editor checklist are all there rather than scattered across services.

### Multi-tenancy: Workspace vs Organization/Project

This is the codebase's biggest trap. There are **two parallel tenancy models**:

- **Dashboard/JWT surface** scopes by `workspaceId` (user-facing concept).
- **Partner API/API-key surface** scopes by `organizationId` + `projectId`.

They are bridged lazily: `createApiKey` and the generate flow auto-create an `Organization` named `` `${workspace.name} (${workspace.id})` `` and a `Project` whose **`slug` is the workspace id**. Any code that looks up the org/project for a workspace must use that exact naming convention, or it will silently create a second org and read an empty result set. `BlogService.getUserOrganizationAndProject()` is the canonical implementation.

### Content storage and formats

Post content lives in `PostRevision` rows (versioned, `editor: AI|HUMAN`), never on the post itself. The canonical stored format is **JSON** — `{ content: "<markdown>", metadata: { toc, faq, seo } }`. `common/utils/content-format.util.ts` converts to `md`/`html` on read; API endpoints expose this via `?format=`. `content_html` is always sanitized through `HtmlSanitizerService` before leaving the backend.

`getPublishedRevision()` (`common/utils/revision.util.ts`) picks which revision is live — don't reach for `revisions[0]`.

### Auth surfaces

Three distinct mechanisms, each with its own guard:

- `JwtAuthGuard` — dashboard/admin. Admin routes additionally need `RolesGuard` + `@Roles(UserRole.ADMIN)`.
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
