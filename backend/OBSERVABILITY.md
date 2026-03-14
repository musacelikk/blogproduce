# Observability Guide

## Overview

This application implements comprehensive observability features for debugging, monitoring, and error tracking.

## Features

### 1. Request ID Tracking

Every request gets a unique `requestId` that is:
- Generated automatically (or uses `X-Request-ID` header if provided)
- Added to response headers (`X-Request-ID`)
- Included in every response body
- Used for tracing requests across services

**Usage:**
```bash
# Request with custom request ID
curl -H "X-Request-ID: my-custom-id" https://api.example.com/v1/api/blog/generate

# Response includes requestId
{
  "success": true,
  "requestId": "my-custom-id",
  "data": {...}
}
```

### 2. Structured Logging

All logs are in JSON format for easy parsing and analysis.

**Log Format:**
```json
{
  "type": "request|response|error",
  "requestId": "uuid",
  "method": "POST",
  "url": "/v1/api/blog/generate",
  "statusCode": 200,
  "duration": 1234,
  "timestamp": "2024-01-01T10:00:00.000Z"
}
```

### 3. Sentry Error Tracking

Sentry is integrated for error tracking and monitoring.

**Setup:**
1. Add `SENTRY_DSN` to `.env`:
```env
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
```

2. Errors are automatically captured with:
   - Request context
   - User information (if available)
   - Stack traces
   - Sanitized request data

### 4. Metrics Collection

Metrics are available via admin API:

**Endpoint:** `GET /admin/observability/metrics`

**Response:**
```json
{
  "success": true,
  "data": {
    "generateSuccessRate": 95.5,
    "avgGenerationTime": 2345,
    "avgTokensPerJob": 1500,
    "queueDepth": 10,
    "dlqCount": 2,
    "totalJobs": 1000,
    "successfulJobs": 955,
    "failedJobs": 45
  },
  "requestId": "uuid"
}
```

**Metrics:**
- `generateSuccessRate`: Percentage of successful generations (last 24h)
- `avgGenerationTime`: Average time in milliseconds (last 24h)
- `avgTokensPerJob`: Average tokens per job (last 24h)
- `queueDepth`: Current queue depth
- `dlqCount`: Dead-letter queue count (last 7 days)
- `totalJobs`: Total jobs (last 24h)
- `successfulJobs`: Successful jobs (last 24h)
- `failedJobs`: Failed jobs (last 24h)

### 5. Admin Panel Observability Endpoints

#### Get Recent Jobs
`GET /admin/observability/jobs?organizationId=xxx&projectId=xxx&limit=50&status=generated`

Returns recent jobs with:
- Job ID
- Status
- Author
- Revisions
- Token usage
- Latency

#### Get Errors
`GET /admin/observability/errors?organizationId=xxx&projectId=xxx&limit=50&startDate=2024-01-01&endDate=2024-01-31`

Returns failed jobs with:
- Error messages
- Failure timestamps
- Job details

#### Get Usage Graph
`GET /admin/observability/usage?organizationId=xxx&projectId=xxx&days=30`

Returns daily usage data:
- Jobs per day
- Tokens per day
- Requests per day

#### Get Webhook Logs
`GET /admin/observability/webhooks?organizationId=xxx&projectId=xxx&limit=50&status=success`

Returns webhook delivery logs:
- Delivery status
- Events
- Timestamps

## Environment Variables

```env
# Sentry (optional)
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id

# Logging
NODE_ENV=production|development
LOG_LEVEL=info|debug|warn|error
```

## Best Practices

1. **Always include requestId in error reports**
   - Makes debugging much easier
   - Enables request tracing

2. **Use structured logging**
   - JSON format is machine-readable
   - Easy to parse and analyze

3. **Monitor metrics regularly**
   - Set up alerts for low success rates
   - Monitor queue depth
   - Track DLQ count

4. **Review errors in Sentry**
   - Check for patterns
   - Identify common issues
   - Track error trends

## Integration with Monitoring Tools

### Datadog
- Structured logs can be parsed by Datadog
- Metrics can be exported via API

### Grafana
- Use metrics endpoint for dashboards
- Query structured logs

### CloudWatch
- Structured logs work with CloudWatch Logs Insights
- Metrics can be sent to CloudWatch Metrics

