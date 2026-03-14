# API Security Documentation

## Güvenlik Özeti (Checklist)

| Önlem | Durum | Açıklama |
|-------|--------|----------|
| **Helmet** | ✅ | Güvenlik başlıkları (X-Content-Type-Options, X-Frame-Options vb.). CSP/COEP kapalı. |
| **CORS** | ✅ | Origin whitelist, credentials, blogenerate/railway/vercel pattern. |
| **Rate limiting (Throttler)** | ✅ | Global: IP başına dakikada istek (varsayılan 150). `THROTTLE_LIMIT` ile ayarlanır. |
| **IP Blacklist / Whitelist** | ✅ | `IP_BLACKLIST`, `IP_WHITELIST` (env boşsa kapalı). |
| **Trust proxy** | ✅ | Production’da proxy arkasında doğru IP. |
| **ValidationPipe** | ✅ | `whitelist: true`, `forbidNonWhitelisted: true` – DTO dışı alanlar reddedilir. |
| **JWT auth** | ✅ | Korumalı route’larda `JwtAuthGuard`. |
| **API key auth** | ✅ | API route’larında `ApiKeyGuard` / `ApiKeyOrJwtGuard`. |
| **API key hashing** | ✅ | SHA-256; düz metin saklanmaz. |
| **HMAC (opsiyonel)** | ✅ | Replay koruması (timestamp ±5 dk). |
| **API key rate limit** | ✅ | Workspace bazlı RPM / günlük generate limiti (`RateLimitGuard`). |
| **PII sanitization** | ✅ | Loglarda hassas veri maskeleme (`PiiSanitizationInterceptor`). |
| **Admin route’lar** | ⚠️ | Backend’de sadece `JwtAuthGuard`; admin rolü frontend’de kontrol ediliyor. İsterseniz backend’e `AdminGuard` (role === admin) eklenebilir. |

**Sonuç:** Tüm temel güvenlik önlemleri (rate limiting, helmet, CORS, blacklist/whitelist, validation, auth) hazır. Sınırlar aşırı dar değil; env ile ayarlanabilir.

---

## Authentication Methods

### 1. Bearer Token Authentication (Basic)

**Header:**
```
Authorization: Bearer <api_key>
```

**Alternative Headers:**
- `X-API-Key: <api_key>`
- Query parameter: `?apiKey=<api_key>`

**Security:**
- API key is hashed with SHA-256 before storage
- Plaintext key is **never** stored in database
- Key is shown **only once** during creation

**Workspace Scope:**
- API keys are **workspace-specific** and automatically scoped to the workspace they belong to
- **Workspace slug is NOT required** in private API endpoints (`/api/blog`, `/api/blog/:id`, etc.)
- The API key itself identifies which workspace's content to access

### 2. HMAC Authentication (Legacy, Optional)

**Headers Required:**
```
X-Client-Id: <client_id>
X-Signature: <hmac_signature>
X-Timestamp: <unix_timestamp_ms>
```

**How it works:**
1. Client generates timestamp: `timestamp = Date.now()`
2. Client creates message: `message = JSON.stringify(body) + timestamp`
3. Client calculates HMAC: `signature = HMAC_SHA256(client_secret, message)`
4. Client sends request with all three headers

**Server-side verification:**
- Validates timestamp (max 5 minutes difference)
- Retrieves encrypted `client_secret` from database
- Decrypts secret using AES-256-GCM
- Verifies HMAC signature
- Prevents replay attacks via timestamp validation

**Example (JavaScript):**
```javascript
const crypto = require('crypto');

const clientId = 'bg_client_xxxxx';
const clientSecret = 'bg_secret_xxxxx';
const body = JSON.stringify({ limit: 10 });
const timestamp = Date.now().toString();
const message = `${body}${timestamp}`;

const signature = crypto
  .createHmac('sha256', clientSecret)
  .update(message)
  .digest('hex');

fetch('https://api.example.com/api/v1/published', {
  headers: {
    'X-Client-Id': clientId,
    'X-Signature': signature,
    'X-Timestamp': timestamp,
    'Content-Type': 'application/json',
  },
  body: body,
});
```

## API Key Creation

**Endpoint:** `POST /organizations/:organizationId/projects/:projectId/api-keys`

**Response (shown only once!):**
```json
{
  "id": "uuid",
  "apiKey": "bg_xxxxx",           // Bearer token (shown once!)
  "clientId": "bg_client_xxxxx",  // For HMAC auth (shown once!)
  "clientSecret": "bg_secret_xxxxx", // For HMAC signing (shown once!)
  "name": "Production API Key",
  "expiresAt": null,
  "createdAt": "2024-01-01T00:00:00Z",
  "warning": "Store these credentials securely. They will not be shown again."
}
```

**Important:**
- Store credentials immediately - they cannot be retrieved later
- `apiKey` is hashed and stored as `keyHash` in database
- `clientSecret` is encrypted (AES-256-GCM) and stored separately
- Only `clientId` is visible in API key list

## Security Best Practices

1. **Never store API keys in version control**
2. **Use environment variables for secrets**
3. **Rotate keys regularly**
4. **Use HMAC for additional security** (prevents MITM attacks)
5. **Monitor API key usage** (check `lastUsedAt` field)
6. **Set expiration dates** for temporary keys
7. **Revoke compromised keys immediately**

## Replay Attack Prevention

HMAC authentication includes timestamp validation:
- Timestamp must be within ±5 minutes of server time
- Old requests cannot be replayed
- Clock skew is automatically handled

## Rate Limiting, Helmet, CORS, IP Blacklist/Whitelist

### Rate Limiting (Throttler)

- **Global limit:** IP başına dakikada istek sayısı (varsayılan: 150).
- **Env:** `THROTTLE_LIMIT` (opsiyonel, örn. `200`) – aşırı daraltma yapılmaz.
- Belirli route’larda `@SkipThrottle()` ile kapatılabilir.

### Helmet (Güvenlik Başlıkları)

- X-Content-Type-Options, X-Frame-Options vb. başlıklar eklenir.
- CSP ve COEP kapalı; mevcut uygulama bozulmaz.

### CORS

- `CORS_ORIGIN`: izin verilen origin’ler (virgülle ayrılmış).
- `ALLOW_ALL_ORIGINS=true`: tüm origin’lere izin (gerekirse).
- Production’da blogenerate.com, railway.app, vercel.app pattern’leri desteklenir.
- `allowedHeaders`: Content-Type, Authorization, X-Request-ID.
- `exposedHeaders`: X-RateLimit-Limit, X-RateLimit-Remaining.

### IP Blacklist / Whitelist

- **IP_BLACKLIST:** Virgülle ayrılmış IP’ler – bu IP’ler 403 alır. Boş = kapalı.
- **IP_WHITELIST:** Virgülle ayrılmış IP’ler – sadece bu IP’ler erişebilir. Boş = kapalı.
- Her iki liste de boşsa filtre uygulanmaz; aşırı daraltma yapılmaz.

---

## Environment Variables

Required for HMAC authentication:
```env
API_KEY_ENCRYPTION_KEY=<64_hex_characters>  # 32 bytes for AES-256
```

Optional for security layer:
```env
THROTTLE_LIMIT=150        # Rate limit: requests per minute per IP (default 150)
IP_BLACKLIST=             # Comma-separated IPs to block (empty = off)
IP_WHITELIST=             # Comma-separated IPs to allow only (empty = off)
CORS_ORIGIN=http://localhost:3000
ALLOW_ALL_ORIGINS=false
```

Generate encryption key with:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```