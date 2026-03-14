# API Versioning Strategy

## Overview

This API follows a strict versioning strategy to ensure backward compatibility and prevent breaking changes.

## Versioning Rules

### 1. Endpoint Versioning

- **Current Version**: `/v1/api/blog/...`
- **Legacy Endpoints**: `/api/blog/...` (deprecated, kept for backward compatibility)
- **Future Versions**: `/v2/api/blog/...`, `/v3/api/blog/...`, etc.

### 2. Breaking Changes Policy

**Breaking changes require a new version:**

- Removing or renaming fields
- Changing field types
- Changing required/optional status of fields
- Removing endpoints
- Changing authentication requirements

**Non-breaking changes (allowed in same version):**

- Adding new optional fields
- Adding new endpoints
- Improving error messages
- Performance optimizations

### 3. Response Format Stability

**Within a version, response formats are stable:**

- Field names follow `snake_case` convention
- Field types remain consistent
- Optional fields can be added, but never removed
- Deprecated fields are marked but not removed until next major version

### 4. Deprecation Process

1. Mark field/endpoint as deprecated in documentation
2. Add deprecation warning in response (if applicable)
3. Support for at least 6 months
4. Remove in next major version

## Pagination

### Cursor-Based Pagination (Recommended)

**Endpoint**: `GET /v1/api/blog?cursor=<cursor>&limit=<limit>`

**Request:**
```
GET /v1/api/blog?cursor=eyJ0aW1lc3RhbXAiOiIyMDI0LTAxLTAxVDEwOjAwOjAwLjAwMFoiLCJpZCI6InV1aWQifQ==&limit=50
```

**Response:**
```json
{
  "success": true,
  "data": [...],
  "meta": {
    "next_cursor": "eyJ0aW1lc3RhbXAiOiIyMDI0LTAxLTAxVDEwOjAwOjAwLjAwMFoiLCJpZCI6InV1aWQifQ==",
    "has_more": true,
    "limit": 50
  }
}
```

**Cursor Format:**
- Base64 encoded JSON: `{ timestamp: ISO8601, id: string }`
- Opaque to clients (don't parse, just pass to next request)
- Stable across pagination (no duplicates or missing items)

**Benefits:**
- No duplicates when new items are added
- No missing items when items are deleted
- Better performance (no offset calculation)
- Works well with large datasets

### Offset-Based Pagination (Deprecated)

**Endpoint**: `GET /v1/api/blog?offset=<offset>&limit=<limit>`

**Status**: Deprecated, use cursor-based pagination instead.

**Response includes deprecation warning:**
```json
{
  "success": true,
  "data": [...],
  "meta": {
    "total": 100,
    "limit": 50,
    "offset": 0,
    "deprecated": "offset-based pagination is deprecated. Use cursor-based pagination with ?cursor= parameter."
  }
}
```

## Response Format (v1)

### Generate Blog Response

```json
{
  "success": true,
  "message": "Blog generated successfully",
  "data": {
    "title": "Blog Title",
    "content_markdown": "# Blog Title\n\nContent...",
    "content_html": "<h1>Blog Title</h1><p>Content...</p>",
    "excerpt": "Short excerpt...",
    "cover_image_url": "https://...",
    "cover_image_credit": {
      "name": "Photographer Name",
      "photographer_url": "https://...",
      "photo_url": "https://..."
    },
    "tags": [],
    "categories": [],
    "toc": [
      { "id": "section-1", "title": "Section 1", "level": 1 }
    ],
    "faq": [
      { "question": "Q?", "answer": "A." }
    ],
    "schema_jsonld": {
      "article": { ... }
    },
    "reading_time": 5
  }
}
```

### List Blogs Response

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Blog Title",
      "slug": "blog-slug",
      "excerpt": "Excerpt...",
      "cover_image_url": "https://...",
      "tags": [...],
      "categories": [],
      "created_at": "2024-01-01T10:00:00Z",
      "updated_at": "2024-01-01T10:00:00Z"
    }
  ],
  "meta": {
    "next_cursor": "...",
    "has_more": true,
    "limit": 50
  }
}
```

## Migration Guide

### From Legacy to v1

**Old endpoint:**
```
POST /api/blog/generate
GET /api/blog
```

**New endpoint:**
```
POST /v1/api/blog/generate
GET /v1/api/blog
```

**Changes:**
- Response format is identical (backward compatible)
- Pagination: Use cursor instead of offset
- All field names remain the same

### From Offset to Cursor Pagination

**Before:**
```javascript
let offset = 0;
const limit = 50;
const response = await fetch(`/v1/api/blog?offset=${offset}&limit=${limit}`);
const { data, meta } = await response.json();
offset = meta.offset + limit; // Next page
```

**After:**
```javascript
let cursor = null;
const limit = 50;
const response = await fetch(`/v1/api/blog?cursor=${cursor || ''}&limit=${limit}`);
const { data, meta } = await response.json();
cursor = meta.next_cursor; // Next page
if (!meta.has_more) {
  // No more pages
}
```

## Version Lifecycle

1. **v1** (Current): Stable, no breaking changes
2. **v2** (Future): When breaking changes are needed
3. **Legacy** (`/api/blog`): Deprecated, will be removed in v2

## Support Policy

- **Current Version**: Full support, active development
- **Previous Versions**: Security patches only
- **Legacy Endpoints**: Deprecated, removal planned for next major version

