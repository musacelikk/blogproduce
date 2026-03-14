import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { User } from '../entities/user.entity';
import { RefreshToken } from '../entities/refresh-token.entity';
import { ApiKey } from '../entities/api-key.entity';
import { ApiKeySecret } from '../entities/api-key-secret.entity';
import { JwtService } from '@nestjs/jwt';
import { ApiKeyGuard } from './guards/api-key.guard';
import { HmacAuthGuard } from './guards/hmac-auth.guard';
import { ApiKeyOrJwtGuard } from './guards/api-key-or-jwt.guard';
import { RateLimitGuard } from './guards/rate-limit.guard';
import { ApiKeyRateLimit } from '../entities/api-key-rate-limit.entity';
import { ApiKeyQuotaService } from './services/api-key-quota.service';
import { ApiKeyRotationService } from './services/api-key-rotation.service';
import { WorkspacesModule } from '../workspaces/workspaces.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, RefreshToken, ApiKey, ApiKeySecret, ApiKeyRateLimit]),
    PassportModule,
    forwardRef(() => WorkspacesModule),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'your-secret-key',
        signOptions: { expiresIn: '24h' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, ApiKeyGuard, HmacAuthGuard, ApiKeyOrJwtGuard, RateLimitGuard, ApiKeyQuotaService, ApiKeyRotationService],
  exports: [AuthService, ApiKeyGuard, HmacAuthGuard, ApiKeyOrJwtGuard, RateLimitGuard, ApiKeyQuotaService, ApiKeyRotationService, JwtModule],
})
export class AuthModule {}
