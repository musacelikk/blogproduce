import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { ipFilterMiddleware } from './common/middleware/ip-filter.middleware';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3001);
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');
  const isProduction = nodeEnv === 'production';

  // Trust proxy (Railway, Nginx vb.) – doğru IP için
  if (isProduction) {
    app.set('trust proxy', 1);
  }

  // Helmet – güvenlik başlıkları (CSP kapalı, mevcut uygulamayı bozmaz)
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    }),
  );

  // IP Blacklist / Whitelist (env boşsa filtre yok)
  const ipFilter = ipFilterMiddleware({
    IP_WHITELIST: configService.get<string>('IP_WHITELIST'),
    IP_BLACKLIST: configService.get<string>('IP_BLACKLIST'),
  });
  app.use(ipFilter);

  // CORS origin ayarları – hem ana domain hem admin subdomain için
  const corsOriginEnv = configService.get<string>('CORS_ORIGIN', 'http://localhost:3000');
  const allowedOrigins = corsOriginEnv
    .split(',')
    .map((origin) => origin.trim().replace(/\/$/, ''))
    .filter((origin) => origin.length > 0);
  const allowAllOrigins = configService.get<string>('ALLOW_ALL_ORIGINS', 'false') === 'true';

  // Public read-only endpoints are meant to be fetched from customers' own sites,
  // so they get permissive CORS (without credentials) before the stricter policy below.
  app.use((req: any, res: any, next: any) => {
    if (req.path?.startsWith('/api/v1/public/')) {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type');
      res.header('Access-Control-Max-Age', '86400');
      if (req.method === 'OPTIONS') {
        return res.sendStatus(204);
      }
    }
    next();
  });

  // Exact-host matching. `origin.includes('example.com')` would also approve
  // https://example.com.attacker.tld, which with credentials:true is a real bypass.
  const trustedRootDomains = ['blogproduce.com'];
  if (isProduction) {
    trustedRootDomains.push('railway.app', 'vercel.app');
  }

  const isTrustedHost = (origin: string): boolean => {
    let hostname: string;
    try {
      hostname = new URL(origin).hostname.toLowerCase();
    } catch {
      return false;
    }
    return trustedRootDomains.some(
      (root) => hostname === root || hostname.endsWith(`.${root}`),
    );
  };

  app.enableCors({
    origin: (origin, callback) => {
      // Origin yoksa (Postman, mobile app vb.) izin ver
      if (!origin) {
        return callback(null, true);
      }

      if (allowAllOrigins) {
        return callback(null, true);
      }

      if (isTrustedHost(origin)) {
        return callback(null, true);
      }

      // Normalize origin (remove trailing slash for comparison)
      const normalizedOrigin = origin.replace(/\/$/, '');

      if (allowedOrigins.includes(normalizedOrigin) || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      if (!isProduction) {
        console.warn(`⚠️  CORS: Unallowed origin: ${origin}`);
        return callback(null, true); // Development'ta esnek
      }

      console.error(`❌ CORS: Not allowed origin: ${origin}`);
      // Deny by omitting CORS headers rather than throwing — an Error here
      // surfaces to the client as a 500 instead of a clean browser-side block.
      callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Request-ID',
      'X-API-Key',
      'Idempotency-Key',
    ],
    exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(port);
  console.log(`🚀 Backend server running on http://localhost:${port}`);
}

bootstrap();

