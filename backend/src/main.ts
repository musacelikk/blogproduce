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

  app.enableCors({
    origin: (origin, callback) => {
      // Origin yoksa (Postman, mobile app vb.) izin ver
      if (!origin) {
        return callback(null, true);
      }

      // Production'da tüm origin'lere izin verilmesi isteniyorsa
      if (allowAllOrigins) {
        return callback(null, true);
      }

      // Railway domain pattern kontrolü (railway.app veya railway.app subdomain'leri)
      if (isProduction && origin.includes('railway.app')) {
        return callback(null, true);
      }

      // Vercel domain pattern kontrolü
      if (isProduction && origin.includes('vercel.app')) {
        return callback(null, true);
      }

      // BlogProduce domain pattern kontrolü (blogproduce.com ve subdomain'leri)
      if (origin.includes('blogproduce.com')) {
        return callback(null, true);
      }

      // Normalize origin (remove trailing slash for comparison)
      const normalizedOrigin = origin.replace(/\/$/, '');
      
      // İzin verilen origin'ler listesinde var mı kontrol et
      if (allowedOrigins.includes(normalizedOrigin) || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        // Development'ta daha esnek, production'da sıkı
        if (!isProduction) {
          console.warn(`⚠️  CORS: Unallowed origin: ${origin}`);
          callback(null, true); // Development'ta izin ver
        } else {
          console.error(`❌ CORS: Not allowed origin: ${origin}`);
          callback(new Error('Not allowed by CORS'));
        }
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
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

