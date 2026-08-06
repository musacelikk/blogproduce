# BlogProduce

AI-powered blog generation platform: a Next.js frontend, a NestJS API, and an SQS-driven
worker that runs a multi-stage content pipeline (outline → draft → editorial pass) across
OpenAI and Anthropic models. Customers integrate the generated content into their own sites
through a REST API.

## Project Structure

```
BlogProduce/
├── backend/          # NestJS API server
└── frontend/         # Next.js application
```

## Features

- 🤖 Multi-stage AI generation across OpenAI and Anthropic (Claude) models
- 📝 Customizable blog parameters (topic, tone, target audience)
- 🎨 Modern, responsive UI with Tailwind CSS
- 🔌 Public REST API with cursor pagination, idempotent writes and webhooks
- 🔒 Type-safe API with TypeScript
- ✅ Form validation with Zod

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL
- OpenAI API key (an Anthropic API key is optional and enables the premium tier)

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the backend directory:
```env
PORT=3001
OPENAI_API_KEY=your_openai_api_key_here
CORS_ORIGIN=http://localhost:3000

# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/blogproduce

# JWT Configuration
# Required. Minimum 32 characters - the app refuses to start without it.
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=your-super-secret-refresh-token-key-change-this-in-production

# Admin User Configuration (Required for admin panel)
ADMIN_EMAIL=admin@admin.com
ADMIN_PASSWORD=admin123
ADMIN_NAME=Admin User

# Anthropic (Optional - enables the "premium" quality tier with Claude)
ANTHROPIC_API_KEY=sk-ant-...

# Unsplash API (Optional - for cover images)
UNSPLASH_ACCESS_KEY=your-unsplash-access-key
UNSPLASH_SECRET_KEY=your-unsplash-secret-key
```

4. Create admin user:
```bash
npm run create-admin
```

**Note:** `ADMIN_EMAIL` and `ADMIN_PASSWORD` are required. The script will fail if they are not set.

4. Start the development server:
```bash
npm run start:dev
```

The backend will run on `http://localhost:3001`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file in the frontend directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001

# Google Analytics (Optional)
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

4. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:3000`

## Usage

1. Open `http://localhost:3000` in your browser
2. Fill in the blog topic (required)
3. Optionally add context, tone, and target audience
4. Click "Generate Blog Post"
5. View your generated blog content

## API

The customer-facing REST API is documented in [API_DOCUMENTATION.md](./API_DOCUMENTATION.md), and
the canonical, always-current reference (with runnable examples and key management) lives in the
product at `/dashboard/api-docs`.

Generation is asynchronous: `POST /api/v1/posts:generate` returns a `jobId`, you poll
`GET /api/v1/jobs/{jobId}` until it succeeds, then publish and fetch the article.

## Plans and billing

Customers buy a **monthly token allowance**, plus optional pay-as-you-go top-ups.

| Plan | Fiyat | Aylık token | Kalite seviyeleri | ≈ blog/ay |
|---|---|---|---|---|
| Ücretsiz Deneme | 7 gün ücretsiz | 150.000 | Standart, Pro | ~7 |
| Başlangıç | $19/ay | 500.000 | Standart | ~26 |
| Profesyonel | $49/ay | 1.500.000 | Standart, Pro | ~67 |
| Kurumsal | $149/ay | 3.000.000 | Standart, Pro, Premium | ~114 |

Top-ups: 250K/$12 · 1M/$39 · 5M/$169. Purchased tokens never expire and are spent only after the
monthly allowance runs out.

**Quality tiers** map to models: Standart → `gpt-4o`, Pro → `claude-sonnet-5`,
Premium → `claude-opus-5`. A plan can only generate with the tiers it includes.

Every new signup automatically gets the 7-day trial. Plans and token packs live in the database
and are editable from the admin panel.

**Deploying the billing release to an existing database** — schema auto-sync is off in production,
so the new columns and tables must be applied once:

```bash
cd backend
npm run migrate:billing   # adds trial/token columns + token_packs, token_purchases
npm run seed:catalog      # writes the plans and token packs
```

The migration is additive and idempotent: it only ever adds columns, tables and indexes, never
drops or retypes anything, and it is safe to re-run.

The admin panel's **Maliyet Analizi** screen shows real provider cost per model, per-plan margins
at full allowance usage, token-pack margins, and a what-if calculator for pricing a new plan.
Plan economics are asserted in `backend/src/billing/billing.service.spec.ts` — every paid plan
must stay above a 60% gross margin at 100% usage, so a careless price edit fails the test suite.

## Running in production

Two processes share one build:

```bash
npm run build        # builds the backend
npm run start:api    # HTTP API
npm run start:worker # SQS consumer that runs the AI pipeline
```

The frontend deploys separately (`cd frontend && npm run build && npm run start`).

## Tech Stack

### Backend
- NestJS
- TypeScript
- OpenAI SDK
- Zod (validation)
- class-validator

### Frontend
- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- React Hook Form
- Zod

## Development

### Backend Commands
- `npm run start:dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run linter

### Frontend Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run linter

## Railway Deployment

### Backend Deployment (Railway)

1. **Environment Variables** - Railway dashboard'da şu environment variable'ları ayarlayın:

```env
PORT=3001
NODE_ENV=production
OPENAI_API_KEY=your_openai_api_key_here
CORS_ORIGIN=https://your-frontend-domain.com,https://your-frontend-domain.vercel.app
# BlogProduce domain'leri otomatik olarak izin verilir (blogproduce.com ve subdomain'leri)
# Veya Railway domain'leri için otomatik izin için:
# ALLOW_ALL_ORIGINS=true (sadece güvenli ortamlarda kullanın)

# Database Configuration
DATABASE_URL=postgresql://user:password@host:port/database

# JWT Configuration
# Required. Minimum 32 characters - the app refuses to start without it.
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=your-super-secret-refresh-token-key-change-this-in-production

# Admin User Configuration
ADMIN_EMAIL=admin@admin.com
ADMIN_PASSWORD=admin123
ADMIN_NAME=Admin User

# Unsplash API (Optional)
UNSPLASH_ACCESS_KEY=your-unsplash-access-key
UNSPLASH_SECRET_KEY=your-unsplash-secret-key
```

2. **CORS Ayarları**:
   - `CORS_ORIGIN`: Frontend URL'lerini virgülle ayırarak ekleyin
   - Örnek: `https://your-app.vercel.app,https://your-custom-domain.com`
   - Railway domain'leri (`*.railway.app`) otomatik olarak izin verilir
   - Vercel domain'leri (`*.vercel.app`) otomatik olarak izin verilir
   - BlogProduce domain'leri (`*.blogproduce.com`) otomatik olarak izin verilir

3. **CORS Hatası Çözümü**:
   - Railway'de CORS hatası alıyorsanız:
     - Frontend URL'inizi `CORS_ORIGIN` environment variable'ına ekleyin
     - Veya `ALLOW_ALL_ORIGINS=true` ayarlayın (sadece güvenli ortamlarda)
     - Backend loglarında hangi origin'in reddedildiğini kontrol edin

### Frontend Deployment (Vercel/Railway)

1. **Environment Variables** - Vercel/Railway dashboard'da:

```env
NEXT_PUBLIC_API_URL=https://api.blogproduce.com
```

**Not:** Production'da backend URL'i `https://api.blogproduce.com` olarak ayarlanmalıdır. Development'ta `http://localhost:3001` kullanılır.

2. **Backend URL'i güncelleyin**: Frontend'in `NEXT_PUBLIC_API_URL` değişkenini production backend URL'inize ayarlayın.
   - Production: `https://api.blogproduce.com`
   - Development: `http://localhost:3001`

## License

MIT

