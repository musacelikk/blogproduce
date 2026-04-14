# Blog Generator API Documentation

**Version:** 1.0.0  
**Last Updated:** January 26, 2026  
**Base URL:** `https://api.blogproduce.com`

---

## Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Authentication](#authentication)
- [API Reference](#api-reference)
  - [List Blog Posts](#list-blog-posts)
  - [Get Blog Post by ID](#get-blog-post-by-id)
  - [Get Blog Post by Slug](#get-blog-post-by-slug)
  - [Publish Blog Post](#publish-blog-post)
- [Error Handling](#error-handling)
- [Rate Limits & Quotas](#rate-limits--quotas)
- [Best Practices](#best-practices)
- [Code Examples](#code-examples)
- [Troubleshooting](#troubleshooting)
- [Support](#support)

---

## Overview

Blog Generator API is a **delivery and management** API that enables you to retrieve and manage your published blog posts. The API provides programmatic access to your blog content, allowing you to integrate published posts into your applications, websites, and automation systems.

### Key Features

- 📖 **Content Delivery** - Retrieve published blog posts via REST API
- 🔍 **Flexible Querying** - Filter by status, organization, project, or slug
- 📊 **Rich Metadata** - Full content, SEO data, tags, and author information
- ⚡ **Fast & Reliable** - Optimized for production use with high availability
- 🔒 **Secure Access** - API key authentication for private content

### Base URLs

| Environment | URL |
|------------|-----|
| Production | `https://api.blogproduce.com` |
| Development | `http://localhost:3001` |

### API Versioning

- Current version: `/api/blog` (legacy, offset-based pagination)
- Versioned API: `/v1/api/blog` (recommended, cursor-based pagination)
- Future versions will be available at `/v2/api/blog`, `/v3/api/blog`, etc.

### Content Types

- **Request Format:** `application/json`
- **Response Format:** `application/json`
- **Character Encoding:** `UTF-8`

---

## Quick Start

### Step 1: Get Your API Key

1. Log in to your [BlogGenerator Dashboard](https://blogproduce.com/dashboard)
2. Navigate to **API Docs** section
3. Select your workspace
4. Click **"Create New API Key"**
5. Copy and securely store your API key (shown only once)

### Step 2: Make Your First Request

```bash
curl -X GET "https://api.blogproduce.com/v1/api/blog?status=published&limit=10" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### Step 3: Handle the Response

```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Getting Started with React Hooks",
      "slug": "getting-started-with-react-hooks",
      "excerpt": "Learn React Hooks with practical examples...",
      "status": "published",
      "content_markdown": "# Getting Started with React Hooks...",
      "content_html": "<h1>Getting Started with React Hooks</h1>...",
      "reading_time": 5
    }
  ],
  "meta": {
    "next_cursor": "eyJ0aW1lc3RhbXAiOiIyMDI0LTAxLTA3VDEwOjAwOjAwLjAwMFoiLCJpZCI6IjU1MGU4NDAwLWUyOWItNDFkNC1hNzE2LTQ0NjY1NTQ0MDAwMCJ9",
    "has_more": true,
    "limit": 10
  }
}
```

---

## Authentication

API requests require authentication using **API Keys** for complete access (read, update, delete).

API keys are workspace-specific and provide access to content within that workspace.

### Workspace Slug Requirements

**Private API Endpoints (API Key Authentication):**
- **Workspace slug is NOT required**
- API keys are workspace-specific and automatically scoped to the workspace they belong to
- Endpoints: `/v1/api/blog`, `/v1/api/blog/:id`, `/v1/api/blog/slug/:slug`, `/posts/:id/publish`
- The API key itself identifies which workspace's content to access


### API Key Format

API keys follow this format:
```
bg_<64-character-hex-string>
```

Example: `bg_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2`

### Authentication Methods

#### Method 1: Bearer Token (Recommended)

Include your API key in the `Authorization` header:

```http
Authorization: Bearer bg_your_api_key_here
```

#### Method 2: X-API-Key Header

```http
X-API-Key: bg_your_api_key_here
```

#### Method 3: Query Parameter (Not Recommended)

```http
GET /v1/api/blog?apiKey=bg_your_api_key_here
```

> **⚠️ Security Note:** Query parameters may be logged in server logs. Use Bearer token method for production.

### Client Secret & Client ID Authentication (Read-Only Access)

For read-only access to blog posts, you can use **Client Secret** and **Client ID** authentication with HMAC signing. This method allows you to retrieve (GET) blog posts but **does not allow creating or modifying** (POST/PATCH/DELETE) content.

#### How It Works

1. **Client ID**: Public identifier (e.g., `bg_client_xxxxx`)
2. **Client Secret**: Secret key used for HMAC signature generation
3. **HMAC Signature**: SHA-256 HMAC of request body + timestamp

#### Authentication Headers

```http
X-Client-Id: bg_client_xxxxx
X-Signature: <hmac_signature>
X-Timestamp: <unix_timestamp_in_milliseconds>
```

#### Generating HMAC Signature

```javascript
const crypto = require('crypto');

const clientSecret = 'your_client_secret';
const body = JSON.stringify(requestBody); // Empty string for GET requests
const timestamp = Date.now().toString();
const message = `${body}${timestamp}`;

const signature = crypto
  .createHmac('sha256', clientSecret)
  .update(message)
  .digest('hex');
```

#### Example Request

```bash
curl -X GET "https://api.blogproduce.com/api/v1/posts" \
  -H "X-Client-Id: bg_client_xxxxx" \
  -H "X-Signature: <hmac_signature>" \
  -H "X-Timestamp: 1641024000000"
```

#### Limitations

- ✅ **Allowed**: GET requests (list posts, get post by ID/slug)
- ❌ **Not Allowed**: POST, PATCH, DELETE requests (create, update, delete posts)

> **Note**: Client Secret/Client ID authentication is designed for read-only integrations.

#### When to Use Client Secret/Client ID

- **ISR (Incremental Static Regeneration)**: Next.js revalidation
- **Cron Jobs**: Scheduled content updates
- **RSS Feeds**: Generate RSS from published posts
- **Public Blog Listing**: Display posts on your website
- **CDN Caching**: Cache public content at edge

#### When to Use Full API Key

- **Content Management**: Updating, publishing, or deleting posts
- **Full API Access**: All CRUD operations

### Getting API Keys

1. **Dashboard Method:**
   - Log in to your dashboard
   - Go to **API Docs** → **API Key Management**
   - Create a new API key for your workspace

2. **API Method:**
   - Use the workspace API endpoints to programmatically create keys
   - See workspace documentation for details

- ✅ Can retrieve published posts
- ✅ Can access sitemap
- ❌ Cannot create, update, or delete posts
- ❌ Cannot access draft or unpublished content

### Key Security Best Practices

- ✅ Store API keys in environment variables, never in code
- ✅ Use different keys for different environments (dev, staging, prod)
- ✅ Rotate keys regularly (every 90 days recommended)
- ✅ Revoke keys immediately if compromised
- ✅ Never commit API keys to version control
- ✅ Use key names to identify their purpose

---

## API Reference

### List Blog Posts

Retrieve a paginated list of blog posts using **cursor-based pagination** (recommended).

> **⚠️ IMPORTANT:** Always use `/v1/api/blog` endpoint with cursor-based pagination. The legacy `/api/blog` endpoint with offset-based pagination is deprecated and will show a warning in the response.

> **Note:** Workspace slug is **not required** for this endpoint. The API key is workspace-specific, so it automatically returns posts from the workspace associated with your API key.

#### Endpoint

```http
GET /v1/api/blog  ✅ Recommended (Cursor-based pagination)
GET /api/blog     ⚠️ Deprecated (Offset-based pagination - shows warning)
```

#### Request Headers

| Header | Required | Description |
|--------|----------|-------------|
| `Authorization` | Yes | Bearer token with your API key |
| `Content-Type` | No | Optional, defaults to `application/json` |

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `status` | string | No | Filter by post status: `draft`, `generated`, `review`, `published` |
| `limit` | number | No | Number of posts to return (default: 50, max: 100) |
| `cursor` | string | No | **Cursor for pagination (v1 endpoint only, recommended)** - Base64 encoded cursor from previous response's `meta.next_cursor` |

> **⚠️ Deprecated:** `offset` parameter is only available in legacy `/api/blog` endpoint and is deprecated. Always use `/v1/api/blog` with `cursor` parameter instead.

#### Request Example

```bash
# ✅ RECOMMENDED: v1 endpoint with cursor-based pagination
# First request (no cursor needed)
curl -X GET "https://api.blogproduce.com/v1/api/blog?status=published&limit=50" \
  -H "Authorization: Bearer YOUR_API_KEY"

# Next page request (use cursor from previous response's meta.next_cursor)
curl -X GET "https://api.blogproduce.com/v1/api/blog?status=published&limit=50&cursor=eyJ0aW1lc3RhbXAiOiIyMDI0LTAxLTA3VDEwOjAwOjAwLjAwMFoiLCJpZCI6IjU1MGU4NDAwLWUyOWItNDFkNC1hNzE2LTQ0NjY1NTQ0MDAwMCJ9" \
  -H "Authorization: Bearer YOUR_API_KEY"

# ⚠️ DEPRECATED: Legacy endpoint (shows warning in response)
curl -X GET "https://api.blogproduce.com/api/blog?status=published&limit=10&offset=0" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

#### Response Structure

**✅ Success Response (200 OK) - v1 Endpoint (Recommended)**

```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Getting Started with React Hooks",
      "slug": "getting-started-with-react-hooks",
      "excerpt": "Learn React Hooks with practical examples...",
      "status": "published",
      "language": "en",
      "cover_image_url": "https://images.unsplash.com/photo-...",
      "cover_image_credit": {
        "name": "John Doe",
        "photographer_url": "https://unsplash.com/@johndoe",
        "photo_url": "https://unsplash.com/photos/abc123"
      },
      "canonicalUrl": "/blog/getting-started-with-react-hooks",
      "publishedAt": "2026-01-07T10:00:00Z",
      "createdAt": "2026-01-06T15:30:00Z",
      "updatedAt": "2026-01-07T10:00:00Z",
      "tags": [
        {
          "id": "tag-id-1",
          "name": "React",
          "slug": "react"
        }
      ],
      "author": {
        "id": "user-id",
        "name": "John Doe",
        "email": "john@example.com"
      }
    }
  ],
  "meta": {
    "next_cursor": "eyJ0aW1lc3RhbXAiOiIyMDI0LTAxLTA3VDEwOjAwOjAwLjAwMFoiLCJpZCI6IjU1MGU4NDAwLWUyOWItNDFkNC1hNzE2LTQ0NjY1NTQ0MDAwMCJ9",
    "has_more": true,
    "limit": 10
  }
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `data` | array | Array of blog post objects |
| `data[].id` | string | Unique post identifier |
| `data[].title` | string | Post title |
| `data[].slug` | string | URL-friendly slug |
| `data[].excerpt` | string | Post excerpt/summary |
| `data[].status` | string | Post status (`draft`, `published`, etc.) |
| `data[].language` | string | Post language (`tr`, `en`) |
| `data[].cover_image_url` | string | Cover image URL |
| `data[].cover_image_credit` | object | Photo credit information |
| `data[].canonicalUrl` | string | Canonical URL for SEO |
| `data[].publishedAt` | string | Publication date (ISO 8601) |
| `data[].createdAt` | string | Creation date (ISO 8601) |
| `data[].updatedAt` | string | Last update date (ISO 8601) |
| `data[].tags` | array | Associated tags |
| `data[].author` | object | Author information |
| `meta.limit` | number | Number of posts returned |
| `meta.next_cursor` | string | **Cursor for next page (v1 endpoint only)** - Use this in the next request's `cursor` parameter |
| `meta.has_more` | boolean | **Whether more posts are available (v1 endpoint only)** - If `true`, use `next_cursor` to fetch more |

> **⚠️ Deprecated Fields:** `meta.total` and `meta.offset` are only available in legacy `/api/blog` endpoint and are deprecated. Always use `/v1/api/blog` with `next_cursor` and `has_more` instead.

---

### Get Blog Post by ID

Retrieve a single blog post by its ID, including full content.

> **Note:** Workspace slug is **not required** for this endpoint. The API key is workspace-specific, so it automatically returns the post from the workspace associated with your API key.

#### Endpoint

```http
GET /api/blog/:id
GET /v1/api/blog/:id
```

#### Request Headers

| Header | Required | Description |
|--------|----------|-------------|
| `Authorization` | Yes | Bearer token with your API key |

#### URL Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Blog post UUID |

#### Request Example

```bash
curl -X GET "https://api.blogproduce.com/v1/api/blog/550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

#### Response Structure

**Success Response (200 OK)**

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Getting Started with React Hooks",
    "slug": "getting-started-with-react-hooks",
    "excerpt": "Learn React Hooks with practical examples...",
    "status": "published",
    "language": "en",
    "content_markdown": "# Getting Started with React Hooks\n\n## Introduction\n\n...",
    "content_html": "<h1>Getting Started with React Hooks</h1><p>...</p>",
    "reading_time": 5,
    "cover_image_url": "https://images.unsplash.com/photo-...",
    "cover_image_credit": {
      "name": "John Doe",
      "photographer_url": "https://unsplash.com/@johndoe",
      "photo_url": "https://unsplash.com/photos/abc123"
    },
    "canonicalUrl": "/blog/getting-started-with-react-hooks",
    "publishedAt": "2026-01-07T10:00:00Z",
    "createdAt": "2026-01-06T15:30:00Z",
    "updatedAt": "2026-01-07T10:00:00Z",
    "tags": [
      {
        "id": "tag-id-1",
        "name": "React",
        "slug": "react"
      }
    ],
    "author": {
      "id": "user-id",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "toc": [
      {
        "id": "heading-0",
        "title": "Getting Started with React Hooks",
        "level": 1
      },
      {
        "id": "heading-1",
        "title": "Introduction",
        "level": 2
      }
    ],
    "faq": [
      {
        "question": "What are React Hooks?",
        "answer": "React Hooks are functions that let you use state and other React features in functional components."
      }
    ],
    "schema_jsonld": {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": "Getting Started with React Hooks"
    },
    "seo": {
      "metaTitle": "Getting Started with React Hooks: A Complete Guide",
      "metaDescription": "Learn React Hooks with practical examples...",
      "ogTitle": "Getting Started with React Hooks",
      "ogDescription": "Learn React Hooks with practical examples...",
      "robots": "index,follow",
      "schemaJsonld": {
        "@context": "https://schema.org",
        "@type": "Article"
      }
    }
  }
}
```

**Error Response (404 Not Found)**

```json
{
  "success": false,
  "message": "Blog post not found",
  "error": "Blog post not found"
}
```

---

### Get Blog Post by Slug

Retrieve a single blog post by its slug, including full content.

> **Note:** Workspace slug is **not required** for this endpoint. The API key is workspace-specific, so it automatically returns the post from the workspace associated with your API key.

#### Endpoint

```http
GET /api/blog/slug/:slug
GET /v1/api/blog/slug/:slug
```

#### Request Headers

| Header | Required | Description |
|--------|----------|-------------|
| `Authorization` | Yes | Bearer token with your API key |

#### URL Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `slug` | string | Yes | Blog post slug (URL-friendly identifier) |

#### Request Example

```bash
curl -X GET "https://api.blogproduce.com/v1/api/blog/slug/getting-started-with-react-hooks" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

#### Response Structure

Same as [Get Blog Post by ID](#get-blog-post-by-id) response structure.

---

### Publish Blog Post

Publish a draft blog post, making it publicly available.

> **Note:** Workspace slug is **not required** for this endpoint. The JWT token is workspace-specific, so it automatically publishes the post in the workspace associated with your token.

#### Endpoint

```http
POST /posts/:id/publish
```

#### Request Headers

| Header | Required | Description |
|--------|----------|-------------|
| `Authorization` | Yes | Bearer token with your JWT token (dashboard authentication) |

#### URL Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Blog post UUID |

#### Request Example

```bash
curl -X POST "https://api.blogproduce.com/posts/550e8400-e29b-41d4-a716-446655440000/publish" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Response Structure

**Success Response (200 OK)**

```json
{
  "success": true,
  "message": "Post published successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Getting Started with React Hooks",
    "status": "published",
    "publishedAt": "2026-01-07T10:05:00Z",
    ...
  }
}
```

**Error Response (403 Forbidden)**

```json
{
  "success": false,
  "message": "Cannot publish post with status: draft",
  "error": "Post must be in draft or generated status to publish"
}
```

#### Notes

- Only posts with status `draft` or `generated` can be published
- Publishing triggers webhook event `post.published` (if configured)
- Published posts are immediately available via API endpoints

---

### Use Cases

- **ISR (Incremental Static Regeneration)** - Next.js revalidation
- **Cron Jobs** - Scheduled content updates
- **RSS Feeds** - Generate RSS from published posts
- **Public Blog Listing** - Display posts on your website
- **CDN Caching** - Cache public content at edge
- **Search Integration** - Integrate blog content into search functionality
- **Multi-language Support** - Filter and serve content by language

---

## Error Handling

### Error Response Format

All error responses follow this structure:

```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error description"
}
```

### HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| `200` | OK | Request successful |
| `400` | Bad Request | Invalid request parameters |
| `401` | Unauthorized | Missing or invalid API key |
| `403` | Forbidden | API key lacks required permissions |
| `404` | Not Found | Resource not found |
| `429` | Too Many Requests | Rate limit exceeded |
| `500` | Internal Server Error | Server error |
| `503` | Service Unavailable | Service temporarily unavailable |

### Common Error Scenarios

#### 1. Invalid API Key (401)

```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Invalid or expired API key"
}
```

**Solution:**
- Verify your API key is correct
- Check if the key has been revoked
- Ensure you're using the correct workspace key

#### 2. Resource Not Found (404)

```json
{
  "success": false,
  "message": "Blog post not found",
  "error": "Blog post not found"
}
```

**Solution:**
- Verify the post ID or slug is correct
- Check if the post exists in your workspace
- Ensure the post is not hidden or deleted

#### 3. Rate Limit Exceeded (429)

```json
{
  "success": false,
  "message": "Rate limit exceeded",
  "error": "You have exceeded your rate limit. Please try again later."
}
```

**Solution:**
- Wait for the rate limit window to reset
- Upgrade your plan for higher limits
- Implement exponential backoff in your retry logic

---

## Rate Limits & Quotas

### Rate Limits by Plan

| Plan | Requests per Minute | Requests per Day | Monthly Quota |
|------|---------------------|------------------|---------------|
| **Free** | 10 | 100 | 1,000 |
| **Starter** | 30 | 1,000 | 30,000 |
| **Pro** | 100 | 10,000 | 300,000 |
| **Enterprise** | Custom | Custom | Custom |

### Rate Limit Headers

Responses include rate limit information in headers:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1641024000
```

### Handling Rate Limits

When you exceed your rate limit, you'll receive a `429 Too Many Requests` response:

```json
{
  "success": false,
  "message": "Rate limit exceeded",
  "error": "You have exceeded your rate limit of 100 requests per minute"
}
```

**Best Practices:**
- Monitor rate limit headers
- Implement exponential backoff
- Cache responses when possible
- Batch requests when applicable

---

## Best Practices

### 1. API Key Management

- ✅ **Use Environment Variables**
  ```bash
  export BLOG_API_KEY=bg_your_key_here
  ```

- ✅ **Rotate Keys Regularly**
  - Change keys every 90 days
  - Revoke compromised keys immediately

- ✅ **Use Different Keys for Different Environments**
  - Separate keys for dev, staging, production

### 2. Request Optimization

- ✅ **Use Cursor-Based Pagination (v1)**
  - More efficient than offset-based
  - Consistent results even with concurrent updates

- ✅ **Cache Public Content**
  - API responses can be cached
  - Use appropriate cache headers

- ✅ **Filter by Status**
  - Use `status=published` for production content
  - Reduces response size and improves performance

### 3. Error Handling

- ✅ **Implement Retry Logic**
  - Exponential backoff for 429 errors
  - Max 3 retries for 500 errors

- ✅ **Handle Timeouts**
  - Set appropriate timeout values (10-30 seconds)
  - Implement timeout handling

### 4. Content Delivery

- ✅ **Use API endpoints for ISR**
  - No authentication required
  - Optimized for caching
  - Perfect for Next.js revalidation

- ✅ **Cache Responses**
  - Cache generated content when appropriate
  - Use ETags for conditional requests

- ✅ **Monitor Usage**
  - Track API usage regularly
  - Set up alerts for quota limits

---

## Code Examples

### JavaScript (Fetch API)

```javascript
const API_BASE_URL = 'https://api.blogproduce.com';
const API_KEY = process.env.BLOG_API_KEY;

// ✅ RECOMMENDED: List published posts with cursor-based pagination
// Note: Workspace slug is NOT required - API key is workspace-specific
// Always use /v1/api/blog endpoint for cursor-based pagination
async function listPublishedPosts(options = {}) {
  const { limit = 50, status = 'published', cursor } = options;
  
  const params = new URLSearchParams({
    status,
    limit: limit.toString(),
  });
  
  // Add cursor if provided (for pagination)
  if (cursor) {
    params.append('cursor', cursor);
  }

  // ✅ Use v1 endpoint for cursor-based pagination
  const response = await fetch(
    `${API_BASE_URL}/v1/api/blog?${params.toString()}`,
    {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  const data = await response.json();
  
  // Response format: { success: true, data: [...], meta: { next_cursor, has_more, limit } }
  return {
    posts: data.data || [],
    meta: data.meta || {}
  };
}

// Get all posts with automatic pagination
async function getAllPublishedPosts(status = 'published') {
  const allPosts = [];
  let cursor = undefined;
  let hasMore = true;
  const limit = 50;

  while (hasMore) {
    const result = await listPublishedPosts({ status, limit, cursor });
    allPosts.push(...result.posts);
    
    hasMore = result.meta?.has_more ?? false;
    cursor = result.meta?.next_cursor;
    
    if (!cursor && !hasMore) break;
  }

  return allPosts;
}

// Get post by ID
// Note: Workspace slug is NOT required - API key is workspace-specific
async function getPostById(postId) {
  const response = await fetch(
    `${API_BASE_URL}/v1/api/blog/${postId}`,
    {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  const data = await response.json();
  return data.data;
}

// Get post by slug (private endpoint)
// Note: Workspace slug is NOT required - API key is workspace-specific
async function getPostBySlugPrivate(slug) {
  const response = await fetch(
    `${API_BASE_URL}/v1/api/blog/slug/${slug}`,
    {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  const data = await response.json();
  return data.data;
}

// Usage
(async () => {
  try {
    // ✅ First page: List published posts (no cursor needed)
    const firstPage = await listPublishedPosts({ limit: 50, status: 'published' });
    console.log('First page posts:', firstPage.posts);
    console.log('Has more:', firstPage.meta?.has_more);
    console.log('Next cursor:', firstPage.meta?.next_cursor);

    // ✅ Next page: Use cursor from previous response
    if (firstPage.meta?.has_more && firstPage.meta?.next_cursor) {
      const nextPage = await listPublishedPosts({ 
        limit: 50, 
        status: 'published',
        cursor: firstPage.meta.next_cursor 
      });
      console.log('Next page posts:', nextPage.posts);
    }

    // ✅ Get all posts automatically (with pagination)
    const allPosts = await getAllPublishedPosts('published');
    console.log('Total posts:', allPosts.length);

    // Get single post by ID
    if (firstPage.posts.length > 0) {
      const post = await getPostById(firstPage.posts[0].id);
      console.log('Post title:', post.title);
      console.log('Post content:', post.content_markdown);
    }

    // Get single post by slug
    const postBySlug = await getPostBySlugPrivate('my-post-slug');
    console.log('Post by slug:', postBySlug.title);
  } catch (error) {
    console.error('Error:', error.message);
  }
})();
```

### Python

```python
import requests
import os

API_BASE_URL = 'https://api.blogproduce.com'
API_KEY = os.getenv('BLOG_API_KEY')

def list_published_posts(limit=50, cursor=None):
    """List published blog posts with cursor-based pagination.
    ✅ Always use /v1/api/blog endpoint for cursor-based pagination.
    Note: Workspace slug is NOT required - API key is workspace-specific."""
    url = f"{API_BASE_URL}/v1/api/blog"
    params = {
        'status': 'published',
        'limit': limit,
    }
    if cursor:
        params['cursor'] = cursor

    headers = {
        'Authorization': f'Bearer {API_KEY}',
        'Content-Type': 'application/json',
    }

    response = requests.get(url, params=params, headers=headers)
    response.raise_for_status()
    return response.json()

def get_all_published_posts(status='published'):
    """Get all published posts with automatic pagination."""
    all_posts = []
    cursor = None
    has_more = True
    limit = 50

    while has_more:
        result = list_published_posts(limit=limit, cursor=cursor)
        if result.get('success') and result.get('data'):
            all_posts.extend(result['data'])
            has_more = result.get('meta', {}).get('has_more', False)
            cursor = result.get('meta', {}).get('next_cursor')
            if not cursor and not has_more:
                break
        else:
            break

    return all_posts

def get_post_by_id(post_id):
    """Get a single post by ID.
    ✅ Always use /v1/api/blog endpoint.
    Note: Workspace slug is NOT required - API key is workspace-specific."""
    url = f"{API_BASE_URL}/v1/api/blog/{post_id}"
    headers = {
        'Authorization': f'Bearer {API_KEY}',
    }

    response = requests.get(url, headers=headers)
    response.raise_for_status()
    return response.json()['data']

def get_post_by_slug(slug):
    """Get a single post by slug (private endpoint).
    ✅ Always use /v1/api/blog endpoint.
    Note: Workspace slug is NOT required - API key is workspace-specific."""
    url = f"{API_BASE_URL}/v1/api/blog/slug/{slug}"
    headers = {
        'Authorization': f'Bearer {API_KEY}',
    }

    response = requests.get(url, headers=headers)
    response.raise_for_status()
    return response.json()['data']

# Usage
if __name__ == '__main__':
    try:
        # ✅ First page: List published posts (no cursor needed)
        result = list_published_posts(limit=50)
        if result.get('success'):
            posts = result.get('data', [])
            meta = result.get('meta', {})
            print(f"First page: {len(posts)} posts")
            print(f"Has more: {meta.get('has_more', False)}")
            print(f"Next cursor: {meta.get('next_cursor', 'None')}")
            
            # ✅ Next page: Use cursor from previous response
            if meta.get('has_more') and meta.get('next_cursor'):
                next_result = list_published_posts(limit=50, cursor=meta['next_cursor'])
                if next_result.get('success'):
                    print(f"Next page: {len(next_result.get('data', []))} posts")
            
            # ✅ Get all posts automatically
            all_posts = get_all_published_posts('published')
            print(f"Total posts: {len(all_posts)}")
        
        # Get single post by ID
        if posts:
            post = get_post_by_id(posts[0]['id'])
            print(f"Title: {post['title']}")
            print(f"Content: {post['content_markdown'][:200]}...")
        
        # Get single post by slug
        post_by_slug = get_post_by_slug('my-post-slug')
        print(f"Post by slug: {post_by_slug['title']}")
    except Exception as e:
        print(f"Error: {e}")
```

### Next.js ISR Example

```typescript
// app/blog/[slug]/page.tsx
import { notFound } from 'next/navigation';

const API_BASE_URL = process.env.API_BASE_URL || 'https://api.blogproduce.com';
const API_KEY = process.env.BLOG_API_KEY; // API key from environment (workspace'e bağlı)

// Note: Workspace slug is NOT required - API key is workspace-specific
async function getPost(slug: string) {
  const res = await fetch(
    `${API_BASE_URL}/v1/api/blog/slug/${slug}`,
    {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
      },
      next: { revalidate: 3600 }, // Revalidate every hour
    }
  );

  if (!res.ok) {
    return null;
  }

  const data = await res.json();
  return data.data;
}

export default async function BlogPostPage({
  params,
}: {
  params: { slug: string };
}) {
  const post = await getPost(params.slug);

  if (!post) {
    notFound();
  }

  return (
    <article>
      <h1>{post.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: post.content_html }} />
    </article>
  );
}

// Generate static params for ISR
// Note: Workspace slug is NOT required - API key is workspace-specific
export async function generateStaticParams() {
  const res = await fetch(
    `${API_BASE_URL}/v1/api/blog?status=published&limit=100`,
    {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
      },
      next: { revalidate: 3600 },
    }
  );

  if (!res.ok) {
    return [];
  }

  const data = await res.json();
  return data.data.map((post: any) => ({
    slug: post.slug,
  }));
}
```

---

## Troubleshooting

### Common Issues

#### Issue: "Invalid API Key" Error

**Symptoms:**
- 401 Unauthorized response
- "Invalid or expired API key" error message

**Solutions:**
1. Verify API key is correct (no extra spaces)
2. Check if key has been revoked in dashboard
3. Ensure you're using the correct workspace key
4. Regenerate API key if necessary

#### Issue: Post Not Found

**Symptoms:**
- 404 Not Found response
- "Blog post not found" error message

**Solutions:**
1. Verify the post ID or slug is correct
2. Check if the post exists in your workspace
3. Ensure the post is published (not draft)
4. Verify organization and project IDs match

#### Issue: Rate Limit Exceeded

**Symptoms:**
- 429 Too Many Requests response
- Rate limit error message

**Solutions:**
1. Wait for the rate limit window to reset
2. Upgrade your plan for higher limits
3. Implement exponential backoff
4. Cache responses to reduce API calls

#### Issue: Deprecated Pagination Warning

**Symptoms:**
- Response includes `meta.deprecated: "offset-based pagination is deprecated. Use cursor-based pagination with ?cursor= parameter."`
- Empty data array returned
- Using `/api/blog` endpoint instead of `/v1/api/blog`

**Solutions:**
1. **Always use `/v1/api/blog` endpoint** instead of `/api/blog`
2. Use cursor-based pagination with `cursor` parameter instead of `offset`
3. First request: `GET /v1/api/blog?status=published&limit=50` (no cursor)
4. Next requests: Use `meta.next_cursor` from previous response as `cursor` parameter
5. Check `meta.has_more` to determine if more pages are available

**Example Fix:**
```javascript
// ❌ WRONG (deprecated)
const response = await fetch('/v1/api/blog?status=published&limit=50', ...);

// ✅ CORRECT (recommended)
const response = await fetch('/v1/api/blog?status=published&limit=50', ...);
// Then use meta.next_cursor for next page
```

---

## Support

### Getting Help

- 📧 **Email:** support@blogproduce.com
- 💬 **Discord:** [Join our Discord server](https://discord.gg/blogproduce)
- 📖 **Documentation:** [Full Documentation](https://blogproduce.com/docs)
- 🐛 **Bug Reports:** [GitHub Issues](https://github.com/blogproduce/issues)

### Response Times

- **General Inquiries:** 24-48 hours
- **Technical Support:** 12-24 hours
- **Critical Issues:** 4-8 hours
- **Enterprise Support:** 1-4 hours (dedicated support)

---

## License & Terms

This API is provided under the terms of your subscription agreement. Usage is subject to:
- Acceptable Use Policy
- Rate limits and quotas
- Content guidelines
- Privacy policy

For full terms, see: [Terms of Service](https://blogproduce.com/terms)

---

**Last Updated:** January 26, 2026  
**API Version:** 1.0.0  
**Documentation Version:** 1.0.0
