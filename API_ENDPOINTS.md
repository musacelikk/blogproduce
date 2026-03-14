# API Endpoints Documentation

## Authentication

**API key tek başına yeterlidir.** Backend, otomasyon ve tüm CRUD işlemleri için sadece `Authorization: Bearer <api_key>` kullanın.

- **Bearer Token (önerilen):** `Authorization: Bearer <api_key>` — Okuma + yazma (GET, POST, PATCH, DELETE).
- **HMAC (opsiyonel):** `X-Client-Id`, `X-Signature`, `X-Timestamp` — Sadece **okuma (GET)**; client-side veya read-only senaryolar için. Client ID ve Client Secret kullanmak **zorunlu değildir**; çoğu kullanım için API key yeterlidir.

## 1. Blog Listing & Management

> **Important:** All endpoints in this section use **API key authentication**. Workspace slug is **not required** because the API key is workspace-specific and automatically scoped to the workspace it belongs to.

### GET `/v1/api/blog`

List posts with **cursor-based pagination**.

> **⚠️ IMPORTANT:** Always use `/v1/api/blog` endpoint. The legacy `/api/blog` endpoint with offset-based pagination is deprecated and will show a warning in the response.

> **Note:** Workspace slug is **not required**. The API key is workspace-specific, so it automatically returns posts from the workspace associated with your API key.

**Query Parameters:**
- `status` (optional): Filter by status (`draft`, `generated`, `review`, `published`)
- `limit` (optional, default: 50): Number of posts per page (max: 100)
- `cursor` (optional): **Base64 encoded cursor from previous response's `meta.next_cursor`** - Use this for pagination

> **⚠️ Deprecated:** `offset` parameter is only available in legacy `/api/blog` endpoint and is deprecated. Always use `/v1/api/blog` with `cursor` parameter instead.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Post Title",
      "slug": "post-slug",
      "excerpt": "Post excerpt",
      "status": "published",
      "language": "tr",
      "cover_image_url": "https://...",
      "publishedAt": "2024-01-01T00:00:00Z",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z",
      "author": {
        "id": "user-id",
        "name": "Author Name",
        "email": "author@example.com"
      },
      "tags": []
    }
  ],
  "meta": {
    "next_cursor": "base64_encoded_cursor",
    "has_more": true,
    "limit": 50
  }
}
```

**Pagination Flow:**
1. First request: `GET /v1/api/blog?status=published&limit=50` (no cursor)
2. Check `meta.has_more` - if `true`, use `meta.next_cursor` for next page
3. Next request: `GET /v1/api/blog?status=published&limit=50&cursor=<next_cursor>`
4. Repeat until `meta.has_more` is `false`

### GET `/v1/api/blog/{id}` ✅ Recommended

Get a specific post by ID.

> **Note:** Workspace slug is **not required**. The API key is workspace-specific, so it automatically returns the post from the workspace associated with your API key.

> **⚠️ Legacy:** `/api/blog/{id}` endpoint is still available but `/v1/api/blog/{id}` is recommended.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Post Title",
    "slug": "post-slug",
    "excerpt": "Post excerpt",
    "content": "JSON or Markdown/HTML (see format param)",
    "contentFormat": "json",
    "content_html": "<p>...</p>",
    "status": "generated",
    "language": "tr",
    "coverImageUrl": "https://...",
    "publishedAt": null,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z",
    "author": {...},
    "tags": [],
    "seo": {...}
  }
}
```

> **Blog görünümü (sitede makale göstermek):** Yanıtta her zaman `content_html` alanı gelir. Sitede makaleyi göstermek için **`content_html`** kullanın ve HTML olarak render edin (React: `<div dangerouslySetInnerHTML={{ __html: data.content_html ?? '' }} />`, Vue: `v-html`, vanilla: `element.innerHTML = data.content_html`). **`content` asla metin olarak gösterilmemelidir** — ham HTML/markdown/JSON görünür. İçerik etiketler halinde görünüyorsa `content` kullanılıyordur; `content_html` + innerHTML kullanın.

**Query:** `format` (opsiyonel): `json` | `md` | `html` — `content` alanının formatı. `content_html` her durumda doldurulur.

### GET `/v1/api/blog/slug/{slug}` ✅ Recommended

Get a specific post by slug.

> **Note:** Workspace slug is **not required**. The API key is workspace-specific, so it automatically returns the post from the workspace associated with your API key.

### POST `/posts/{id}/publish`

Publish a draft post.

> **Note:** Workspace slug is **not required**. The JWT token is workspace-specific, so it automatically publishes the post in the workspace associated with your token. This endpoint requires JWT token (dashboard authentication), not API key.

**Body:**
```json
{
  "slug": "optional-custom-slug"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "published",
    "slug": "post-slug",
    "publishedAt": "2024-01-01T00:00:00Z",
    "message": "Post published successfully"
  }
}
```

## Error Responses

All endpoints return errors in this format:

```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error information"
}
```

**HTTP Status Codes:**
- `200`: Success
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (invalid API key)
- `404`: Not Found
- `500`: Internal Server Error

