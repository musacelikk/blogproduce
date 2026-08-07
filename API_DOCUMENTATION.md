# BlogProduce API

Generate AI-written, SEO-ready blog posts and serve them anywhere — your website, app or CMS.

> **The canonical, always-current reference lives in the product** at `/dashboard/api-docs`,
> where you can also create and revoke API keys and copy runnable examples. This file is a
> summary for people browsing the repository.

**Base URL:** `https://api.blogproduce.com` (development: `http://localhost:3001`)

## Authentication

Every request carries your secret API key (prefixed `bg_secret_`), which is shown once when you
create it:

```bash
curl https://api.blogproduce.com/api/v1/posts \
  -H "Authorization: Bearer bg_secret_YOUR_KEY"
```

`X-API-Key: bg_secret_...` is accepted as an alternative header.

Keys are scoped to a workspace — a request only ever sees that workspace's posts. Revoking a key
takes effect immediately.

**Keep the secret key server-side.** For rendering published posts from a browser, use the
[Public API](#public-api-no-auth), which needs no key.

## Response envelope

Every successful response has the same shape:

```json
{ "success": true, "data": {} }
```

Errors use standard HTTP status codes with a JSON body:

```json
{
  "statusCode": 400,
  "message": "topic must be longer than or equal to 5 characters",
  "error": "Bad Request"
}
```

| Status | Meaning |
|---|---|
| 400 | Validation failed. Unknown body fields are rejected too. |
| 401 | Missing, invalid, expired or revoked API key. |
| 403 | Valid key, but not allowed to perform this action. |
| 404 | Resource does not exist, or belongs to another workspace. |
| 409 | `Idempotency-Key` reused with a different body, or a duplicate request is in flight. |
| 429 | Rate limit exceeded — back off and retry. |
| 500 | Server-side error. Safe to retry with the same `Idempotency-Key`. |

## The integration flow

Generation is asynchronous — four calls end to end:

```bash
# 1) Queue a blog post
curl -X POST https://api.blogproduce.com/api/v1/posts:generate \
  -H "Authorization: Bearer bg_secret_YOUR_KEY" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: first-post-001" \
  -d '{
    "topic": "How to choose a CRM for a small business",
    "language": "en",
    "tone": "professional",
    "length": "medium",
    "model": "pro",
    "seoMode": true
  }'
# -> { "success": true, "data": { "jobId": "...", "status": "queued" } }

# 2) Poll until it finishes (typically 30-90 seconds)
curl https://api.blogproduce.com/api/v1/jobs/JOB_ID \
  -H "Authorization: Bearer bg_secret_YOUR_KEY"
# -> { "success": true, "data": { "status": "succeeded", "postId": "..." } }

# 3) Publish
curl -X POST https://api.blogproduce.com/api/v1/posts/POST_ID/publish \
  -H "Authorization: Bearer bg_secret_YOUR_KEY" \
  -H "Content-Type: application/json" -d '{}'

# 4) Fetch the finished article as HTML
curl "https://api.blogproduce.com/api/v1/published/POST_SLUG?format=html" \
  -H "Authorization: Bearer bg_secret_YOUR_KEY"
```

## Endpoints

### Generate content

`POST /api/v1/posts:generate` — queues a job and returns immediately.

Send an `Idempotency-Key` header: retrying with the same key and an identical body within 24 hours
replays the original response instead of creating a duplicate job.

| Field | Type | Notes |
|---|---|---|
| `topic` | string, 5–200 chars | **Required.** The more specific, the better the article. |
| `language` | string | ISO code — `tr`, `en`, `de`, `fr`, `es` and 30+ more. Default `tr`. |
| `tone` | string ≤100 | e.g. `professional`, `friendly`. Default `professional`. |
| `length` | string | `short` (~600–900 words), `medium` (~1100–1500), `long` (~1800–2600). |
| `model` | string | Quality tier: `standard`, `pro`, `premium`. Default `standard`. |
| `seoMode` | boolean | Adds meta tags, FAQ targeting long-tail queries, keyword placement, JSON-LD. |
| `keywords` | string[] | Target keywords, woven in naturally. |
| `outline` | string | Follow your own structure instead of letting the AI plan it. |
| `additionalContext` | string ≤1000 | Brand facts and product details the writer must respect. |
| `targetAudience` | string ≤100 | Who the article is for. |
| `coverImageUrl` | string | Pre-selected cover image to attach. |

### Job status

`GET /api/v1/jobs/{jobId}` → `{ status, postId?, error? }`, where `status` is one of
`queued | running | succeeded | failed | cancelled`. Poll every 3–5 seconds.

### Posts

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/v1/posts` | List posts. Query: `status`, `limit` (max 100), `cursor`. |
| `GET` | `/api/v1/posts/{id}` | Get one post. Query: `format`. |
| `PATCH` | `/api/v1/posts/{id}` | Update `title`, `excerpt`, `content`, `slug`. Draft/generated/review only. |
| `DELETE` | `/api/v1/posts/{id}` | Permanently delete the post, its revisions and SEO data. Irreversible; usage records are kept for billing. |
| `POST` | `/api/v1/posts/{id}/publish` | Publish. Optional `slug` in the body. |

### Published content

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/v1/published` | List live posts. Query: `limit`, `cursor`. |
| `GET` | `/api/v1/published/{slug}` | Get one live post. Query: `format`. |

### Public API (no auth)

Read-only and safe to call from a browser — these expose only *published* posts of a project,
addressed by its public project slug.

| Method | Path |
|---|---|
| `GET` | `/api/v1/public/projects/{projectSlug}/posts` |
| `GET` | `/api/v1/public/projects/{projectSlug}/posts/{slug}` |

## Pagination

List endpoints are cursor-paginated:

```json
{
  "success": true,
  "data": {
    "posts": [],
    "cursor": "MjAyNi0wOC0wNFQxMDoxMjowMC4wMDBa",
    "hasMore": true
  }
}
```

Pass `data.cursor` back as `?cursor=` for the next page and stop when `hasMore` is `false`.
`limit` defaults to 50 and is capped at 100.

## Content formats

Endpoints that return full content accept `?format=`:

| Value | Shape |
|---|---|
| `json` (default) | `{ "content": "<markdown>", "metadata": { "toc": [], "faq": [], "seo": {} } }` |
| `md` | The article as plain Markdown. |
| `html` | Sanitized, render-ready HTML. |

Responses always include `content_html` regardless of the requested format, plus a `seo` object with
meta tags and JSON-LD ready to drop into your page `<head>`.

## Rate limits

Requests are rate-limited per API key; the current window is reported on responses:

```http
X-RateLimit-Limit: 150
X-RateLimit-Remaining: 149
```

On `429`, retry with exponential backoff. Generation calls also count against your plan's monthly
content quota.

## Webhooks

Register a webhook to be notified when a post is generated, updated or published. URLs must be
public `https` endpoints — private, loopback and link-local addresses are rejected. Deliveries carry
`X-Webhook-Event`, `X-Webhook-Timestamp` and an `X-Webhook-Signature` HMAC of the request body
computed with your webhook secret.

## Legacy endpoints

`GET /api/blog` (offset pagination) and `GET /v1/api/blog` (cursor pagination) remain available for
existing integrations and accept either an API key or a dashboard session. New integrations should
use `/api/v1/*` above.
