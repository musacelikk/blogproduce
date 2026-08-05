# API Security

## Checklist

| Önlem | Durum | Açıklama |
|-------|--------|----------|
| **Helmet** | ✅ | Güvenlik başlıkları (X-Content-Type-Options, X-Frame-Options vb.). CSP/COEP kapalı. |
| **CORS** | ✅ | Tam hostname eşleşmesi (substring değil). Public read-only uçlar `/api/v1/public/*` için credentials'sız açık. |
| **Rate limiting (Throttler)** | ✅ | Global: IP başına dakikada istek (varsayılan 150). `THROTTLE_LIMIT` ile ayarlanır. |
| **IP Blacklist / Whitelist** | ✅ | `IP_BLACKLIST`, `IP_WHITELIST` (env boşsa kapalı). |
| **Trust proxy** | ✅ | Production'da proxy arkasında doğru IP. |
| **ValidationPipe** | ✅ | `whitelist: true`, `forbidNonWhitelisted: true` – DTO dışı alanlar reddedilir. |
| **JWT auth** | ✅ | Korumalı route'larda `JwtAuthGuard`. `JWT_SECRET` zorunlu — tanımsızsa uygulama başlamaz. |
| **Admin yetkilendirme** | ✅ | `AdminController` sınıf düzeyinde `JwtAuthGuard + RolesGuard` ve `@Roles(ADMIN)`. Kasıtlı public uçlar `@Public()` ile işaretli. |
| **API key auth** | ✅ | `/api/v1/*` uçlarında `ApiKeyGuard`; legacy blog uçlarında `ApiKeyOrJwtGuard`. |
| **API key hashing** | ✅ | SHA-256; düz metin saklanmaz, yalnızca oluşturulurken bir kez gösterilir. |
| **Tenant izolasyonu** | ✅ | Her API key bir organization+project'e bağlı; sorgular bu kapsamla filtrelenir. |
| **PII sanitization** | ✅ | Loglarda kimlik bilgileri tamamen redakte edilir (önizleme yok), içerik alanları uzunlukla değiştirilir. |
| **Webhook SSRF koruması** | ✅ | Yalnız public `https` host; loopback/private/link-local adresler hem kayıtta hem gönderimde reddedilir. |
| **Idempotency** | ✅ | `Idempotency-Key` işlem öncesi rezerve edilir; farklı gövdeyle tekrar kullanım 409 döner. |
| **DB schema auto-sync** | ✅ | Production'da kapalı (`DB_SYNCHRONIZE=true` ile bilinçli açılabilir). |

### Bilinen sınırlamalar

- **Postgres TLS**: production'da `rejectUnauthorized: false` kullanılıyor. Sağlayıcının CA
  sertifikası ile `ssl: { ca }` yapılandırması önerilir.
- **HMAC imzalı istemci kimlik doğrulaması yoktur.** `bg_client_*` client ID'ler yalnızca public
  tanımlayıcıdır; kimlik doğrulama için kullanılamaz. Tek geçerli yöntem `bg_secret_*` API key'dir.

---

## Authentication

### Bearer token (tek yöntem)

```
Authorization: Bearer bg_secret_...
```

Alternatif başlık: `X-API-Key: bg_secret_...`

- API key SHA-256 ile hash'lenerek saklanır; düz metin **hiçbir zaman** veritabanında tutulmaz.
- Key yalnızca oluşturulduğu anda **bir kez** gösterilir.
- Key workspace'e özeldir; endpoint'lerde ayrıca workspace/slug belirtmeye gerek yoktur — key'in
  kendisi hangi içeriğe erişileceğini belirler.
- İptal edilen key anında geçersiz olur.

### Public uçlar (kimlik doğrulama yok)

`/api/v1/public/projects/:projectSlug/posts` ve alt uçları yalnızca **yayınlanmış** içeriği döner.
Tarayıcıdan doğrudan çağrılabilir; API key gerektirmez ve yazar e-postası gibi hesap bilgilerini
içermez.

---

## Rate limiting

- Global throttle: IP başına dakikada `THROTTLE_LIMIT` (varsayılan 150) istek.
- Yanıtlarda `X-RateLimit-Limit` ve `X-RateLimit-Remaining` başlıkları döner.
- 429 alındığında exponential backoff ile tekrar denenmelidir.

---

## Webhook güvenliği

- URL yalnızca public `https` olabilir. Loopback (`127.0.0.1`, `::1`), private aralıklar
  (`10/8`, `172.16/12`, `192.168/16`), link-local (`169.254/16` — cloud metadata) ve `.local`
  benzeri iç host'lar reddedilir.
- Kontrol hem kayıt sırasında hem her gönderimden önce yapılır (DNS rebinding'e karşı).
- Gövde, webhook secret'ı ile HMAC-SHA256 imzalanır ve `X-Webhook-Signature` başlığında gönderilir;
  `X-Webhook-Event` ve `X-Webhook-Timestamp` başlıkları da eşlik eder.

---

## Zorunlu ortam değişkenleri

| Değişken | Neden zorunlu |
|---|---|
| `JWT_SECRET` | En az 32 karakter. Tanımsızsa uygulama başlatılmaz (sabit fallback yoktur). |
| `DATABASE_URL` veya `DB_*` | Veritabanı bağlantısı. |
| `OPENAI_API_KEY` | İçerik üretimi (standard/pro katmanları). |
| `ANTHROPIC_API_KEY` | Opsiyonel — premium (Claude) katmanını etkinleştirir. |
| `SQS_GENERATE_POST_QUEUE_URL` + AWS kimlik bilgileri | Asenkron üretim kuyruğu. |
