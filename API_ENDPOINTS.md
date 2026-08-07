# API Endpoints

Full reference: [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) — or, always current and with
runnable examples, the in-product docs at `/dashboard/api-docs`.

## Authentication

One method: your secret API key.

```
Authorization: Bearer bg_secret_...
```

`X-API-Key: bg_secret_...` works as an alternative header. `bg_client_*` client IDs are public
identifiers only and cannot authenticate a request.

Keys are workspace-scoped, so no workspace slug appears in any path — the key itself determines
which content the request can see.

## Partner API — `/api/v1`

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/v1/posts:generate` | Queue a generation job. Returns `{ jobId, status: "queued" }`. Send `Idempotency-Key`. |
| `GET` | `/api/v1/jobs/{jobId}` | Poll job status: `queued \| running \| succeeded \| failed \| cancelled`. |
| `GET` | `/api/v1/posts` | List posts. Query: `status`, `limit` (max 100), `cursor`. |
| `GET` | `/api/v1/posts/{id}` | Get one post. Query: `format` = `json \| md \| html`. |
| `PATCH` | `/api/v1/posts/{id}` | Update `title`, `excerpt`, `content`, `slug` (draft/generated/review only). |
| `DELETE` | `/api/v1/posts/{id}` | Permanently delete the post and its revisions (irreversible). |
| `POST` | `/api/v1/posts/{id}/publish` | Publish a post. Optional `slug` in body. |
| `POST` | `/api/v1/publish` | Publish by `postId` in the body. |
| `GET` | `/api/v1/published` | List live posts. Query: `limit`, `cursor`. |
| `GET` | `/api/v1/published/{slug}` | Get one live post. Query: `format`. |

## Public API — no authentication

Read-only, safe from a browser, published content only.

| Method | Path |
|---|---|
| `GET` | `/api/v1/public/projects/{projectSlug}/posts` |
| `GET` | `/api/v1/public/projects/{projectSlug}/posts/{slug}` |

## Response shapes

Every success response is wrapped:

```json
{ "success": true, "data": { } }
```

List endpoints paginate by cursor:

```json
{
  "success": true,
  "data": {
    "posts": [
      {
        "id": "uuid",
        "title": "Post Title",
        "slug": "post-slug",
        "excerpt": "Post excerpt",
        "status": "published",
        "language": "tr",
        "coverImageUrl": null,
        "publishedAt": "2026-08-04T10:20:00.000Z",
        "createdAt": "2026-08-04T10:12:00.000Z",
        "updatedAt": "2026-08-04T10:14:00.000Z",
        "author": { "name": "..." },
        "tags": []
      }
    ],
    "cursor": "MjAyNi0wOC0wNFQxMDoxMjowMC4wMDBa",
    "hasMore": true
  }
}
```

Pass `data.cursor` back as `?cursor=` for the next page; stop when `hasMore` is `false`.

Single-post responses add `content` (in the requested format), `contentFormat`, an always-present
sanitized `content_html`, and a `seo` object with meta tags and JSON-LD.

## Legacy endpoints

`GET /api/blog` (offset pagination) and `GET /v1/api/blog` (cursor pagination, `meta.next_cursor`)
remain available for existing integrations and accept either an API key or a dashboard session.
New integrations should use `/api/v1/*`.
