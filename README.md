# Blog Generator

AI-powered blog post generator using Next.js and NestJS with ChatGPT API integration.

## Project Structure

```
BlogGenerator/
├── backend/          # NestJS API server
└── frontend/         # Next.js application
```

## Features

- 🤖 AI-powered blog generation using OpenAI GPT-4
- 📝 Customizable blog parameters (topic, tone, target audience)
- 🎨 Modern, responsive UI with Tailwind CSS
- 🔒 Type-safe API with TypeScript
- ✅ Form validation with Zod

## Prerequisites

- Node.js 18+ and npm/yarn
- OpenAI API key

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
DATABASE_URL=postgresql://user:password@localhost:5432/bloggenerator

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=your-super-secret-refresh-token-key-change-this-in-production

# Admin User Configuration (Required for admin panel)
ADMIN_EMAIL=admin@admin.com
ADMIN_PASSWORD=admin123
ADMIN_NAME=Admin User

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

## API Endpoints

### POST `/api/blog/generate`

Generate a blog post based on the provided parameters.

**Request Body:**
```json
{
  "topic": "The Future of AI",
  "additionalContext": "Focus on ethical considerations",
  "tone": "Professional",
  "targetAudience": "Developers"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Blog generated successfully",
  "data": {
    "title": "The Future of AI",
    "content": "# The Future of AI\n\n..."
  }
}
```

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

