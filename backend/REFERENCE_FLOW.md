# Reference Flow Documentation

## Overview

This document describes the complete blog generation and publishing flow as implemented in the system.

## Flow Diagram

```
Client → POST /posts/generate
  ↓
API → DB: Create generation_job + post (DRAFT)
  ↓
API → SQS: Send jobId
  ↓
Worker → Receive job from SQS
  ↓
Worker → Generate content (OpenAI)
  ↓
Worker → DB: Save post revision + Update post to DRAFT
  ↓
Worker → DB: Update generation_job to COMPLETED
  ↓
Client → GET /jobs/{jobId} → Get postId
  ↓
Client → PATCH /posts/{id} (optional edit)
  ↓
Client → POST /posts/{id}/publish
  ↓
API → DB: Update post to PUBLISHED
  ↓
API → Webhook: Trigger "post.published" event
  ↓
Client Site → GET /posts/public (ISR/cron)
```

## API Endpoints

### 1. Generate Post

**Endpoint:** `POST /posts/generate`

**Authentication:** JWT required

**Request:**
```json
{
  "workspaceId": "workspace-uuid",
  "topic": "Blog topic",
  "language": "tr",
  "tone": "professional",
  "length": "medium",
  "seoMode": true,
  "model": "gpt-4.1-mini",
  "additionalContext": "Optional context",
  "targetAudience": "Businesses"
}
```

**Response:**
```json
{
  "jobId": "generation-job-uuid",
  "postId": "post-uuid",
  "status": "queued"
}
```

**Flow:**
1. Creates post with status `QUEUED`
2. Creates generation_job with status `PENDING`
3. Sends message to SQS with `jobId`
4. Returns `jobId` and `postId` to client

### 2. Get Job Status

**Endpoint:** `GET /jobs/{jobId}`

**Authentication:** JWT or API Key

**Response:**
```json
{
  "success": true,
  "data": {
    "jobId": "generation-job-uuid",
    "status": "completed",
    "postId": "post-uuid",
    "error": null,
    "createdAt": "2024-01-01T10:00:00Z",
    "startedAt": "2024-01-01T10:00:01Z",
    "completedAt": "2024-01-01T10:00:30Z",
    "processingTimeMs": 29000
  }
}
```

**Job Statuses:**
- `pending` - Job created, waiting in queue
- `processing` - Worker is generating content
- `completed` - Content generated, post is DRAFT
- `failed` - Generation failed
- `cancelled` - Job was cancelled

### 3. Edit Post (Optional)

**Endpoint:** `PATCH /posts/{id}`

**Authentication:** JWT required

**Request:**
```json
{
  "title": "Updated title",
  "content": "Updated content",
  "excerpt": "Updated excerpt"
}
```

**Response:**
```json
{
  "id": "post-uuid",
  "title": "Updated title",
  "status": "draft",
  ...
}
```

**Note:** Creates a new revision if content is updated.

### 4. Publish Post

**Endpoint:** `POST /posts/{id}/publish`

**Authentication:** JWT required

**Response:**
```json
{
  "success": true,
  "message": "Post published successfully",
  "data": {
    "id": "post-uuid",
    "title": "Blog Title",
    "status": "published",
    "publishedAt": "2024-01-01T10:05:00Z",
    ...
  }
}
```

**Flow:**
1. Validates post status (must be `DRAFT` or `GENERATED`)
2. Updates post status to `PUBLISHED`
3. Sets `publishedAt` timestamp
4. Triggers webhook event `post.published` (if webhook configured)

### 5. Public Posts Endpoint

**Endpoint:** `GET /posts/public`

**Authentication:** None required (public endpoint)

**Query Parameters:**
- `limit` - Number of posts to return (default: 10)
- `ids` - Comma-separated post IDs
- `organizationId` - Filter by organization
- `projectId` - Filter by project
- `slug` - Get single post by slug

**Response (List):**
```json
[
  {
    "id": "post-uuid",
    "title": "Blog Title",
    "slug": "blog-slug",
    "excerpt": "Excerpt...",
    "coverImageUrl": "https://...",
    "publishedAt": "2024-01-01T10:05:00Z",
    "language": "tr",
    "author": {
      "name": "Author Name",
      "email": "author@example.com"
    },
    "tags": [...]
  }
]
```

**Response (Single by slug):**
```json
{
  "id": "post-uuid",
  "title": "Blog Title",
  "slug": "blog-slug",
  "content_markdown": "# Blog Title\n\nContent...",
  "content_html": "<h1>Blog Title</h1><p>Content...</p>",
  "reading_time": 5,
  ...
}
```

**Use Cases:**
- ISR (Incremental Static Regeneration) - Next.js
- Cron job to fetch latest posts
- Public blog listing page
- RSS feed generation

## Worker Flow

### Job Processing

1. **Receive Message from SQS**
   - Extract `jobId` and `postId`
   - Check idempotency (skip if already processed)

2. **Acquire Lock**
   - Use pessimistic locking to prevent duplicate processing
   - Check if post is already being processed

3. **Update Job Status**
   - Set job status to `PROCESSING`
   - Set `startedAt` timestamp

4. **Generate Content**
   - Call OpenAI API
   - Record token usage
   - Handle errors (quota, rate limit, etc.)

5. **Save Revision**
   - Create new `PostRevision` with generated content
   - Store model, tokens, latency

6. **Update Post**
   - Set post status to `DRAFT` (not PUBLISHED)
   - Client will publish later

7. **Update Job**
   - Set job status to `COMPLETED`
   - Set `completedAt` timestamp
   - Store `processingTimeMs`

8. **Delete Message**
   - Remove from SQS queue (successful processing)

### Error Handling

- **Quota Exceeded**: Requeue post, don't fail job
- **Rate Limit**: Retry with exponential backoff
- **Invalid Request**: Fail job, update status to `FAILED`
- **Max Retries**: Send to DLQ (Dead-Letter Queue)

## Webhook Events

### Post Published Event

**Event Type:** `post.published`

**Trigger:** When post status changes to `PUBLISHED`

**Payload:**
```json
{
  "event": "post.published",
  "timestamp": "2024-01-01T10:05:00Z",
  "data": {
    "postId": "post-uuid",
    "title": "Blog Title",
    "slug": "blog-slug",
    "publishedAt": "2024-01-01T10:05:00Z"
  }
}
```

**Headers:**
- `X-Webhook-Event`: `post.published`
- `X-Webhook-Signature`: HMAC-SHA256 signature (if secret configured)
- `X-Webhook-Timestamp`: ISO 8601 timestamp

**Webhook Configuration:**
- Set up via `POST /workspaces/{id}/webhooks`
- Events: `["post.published"]`
- Secret: Optional, for signature verification

## Database Schema

### generation_jobs

- `id` (UUID) - Job ID (used as jobId)
- `organizationId` - Organization reference
- `projectId` - Project reference
- `postId` - Post reference
- `status` - Job status enum
- `requestData` - JSONB with request parameters
- `error` - Error message if failed
- `startedAt` - When processing started
- `completedAt` - When processing completed
- `processingTimeMs` - Total processing time

### posts

- `id` (UUID) - Post ID
- `status` - Post status (QUEUED → GENERATING → DRAFT → PUBLISHED)
- `organizationId` - Organization reference
- `projectId` - Project reference
- `publishedAt` - When published (null until published)

## Client Integration Example

```javascript
// 1. Generate post
const generateResponse = await fetch('/posts/generate', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    workspaceId: 'workspace-uuid',
    topic: 'AI and Future',
    seoMode: true,
  }),
});

const { jobId, postId } = await generateResponse.json();

// 2. Poll job status
let jobStatus = 'pending';
while (jobStatus === 'pending' || jobStatus === 'processing') {
  await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
  
  const jobResponse = await fetch(`/jobs/${jobId}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  
  const job = await jobResponse.json();
  jobStatus = job.data.status;
  
  if (jobStatus === 'completed') {
    console.log('Post generated! Post ID:', job.data.postId);
    break;
  } else if (jobStatus === 'failed') {
    console.error('Generation failed:', job.data.error);
    break;
  }
}

// 3. (Optional) Edit post
await fetch(`/posts/${postId}`, {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    title: 'Updated Title',
  }),
});

// 4. Publish post
await fetch(`/posts/${postId}/publish`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
});

// 5. Fetch published posts (public endpoint, no auth)
const publicPosts = await fetch('/posts/public?limit=10');
const posts = await publicPosts.json();
```

## Best Practices

1. **Polling Interval**: Poll job status every 2-5 seconds
2. **Timeout**: Set a maximum wait time (e.g., 5 minutes)
3. **Error Handling**: Handle `failed` status appropriately
4. **Webhook Verification**: Verify webhook signatures if secret is configured
5. **ISR/Cron**: Use public endpoint for fetching published posts
6. **Content Format**: Use `content_markdown` for rendering (safer)

## Status Transitions

**Post Status:**
- `QUEUED` → `GENERATING` → `DRAFT` → `PUBLISHED`
- `QUEUED` → `GENERATING` → `FAILED` (on error)

**Job Status:**
- `PENDING` → `PROCESSING` → `COMPLETED`
- `PENDING` → `PROCESSING` → `FAILED` (on error)

