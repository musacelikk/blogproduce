import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiKey } from '../../entities/api-key.entity';
import { User } from '../../entities/user.entity';

@Injectable()
export class ApiKeyOrJwtGuard implements CanActivate {
  constructor(
    @InjectRepository(ApiKey)
    private apiKeyRepository: Repository<ApiKey>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    
    // Try API key first
    const apiKey = this.extractApiKey(request);
    if (apiKey) {
      try {
        const isValid = await this.validateApiKey(apiKey, request);
        if (isValid) {
          return true;
        }
      } catch (error) {
        // If API key validation fails, try JWT
      }
    }

    // Try JWT token
    try {
      const jwtToken = this.extractJwtToken(request);
      if (jwtToken) {
        const payload = await this.jwtService.verifyAsync(jwtToken);
        const user = await this.userRepository.findOne({ where: { id: payload.sub } });
        if (user) {
          request.user = user;
          return true;
        }
      }
    } catch (error) {
      // JWT validation failed
    }

    throw new UnauthorizedException('API key or JWT token is required');
  }

  private async validateApiKey(apiKey: string, request: any): Promise<boolean> {
    const keyHash = ApiKey.hashKey(apiKey);

    const keyRecord = await this.apiKeyRepository.findOne({
      where: { keyHash },
      relations: ['organization', 'project'],
    });

    if (!keyRecord) {
      if (apiKey.startsWith('bg_client_')) {
        const keyRecordByClientId = await this.apiKeyRepository.findOne({
          where: { clientId: apiKey },
          relations: ['organization', 'project'],
        });
        if (keyRecordByClientId) {
          throw new UnauthorizedException(
            'Client ID authentication requires HMAC signature. Use X-Client-Id, X-Signature, and X-Timestamp headers.',
          );
        }
      }
      throw new UnauthorizedException('Invalid API key');
    }

    if (!keyRecord.active) {
      throw new UnauthorizedException('API key is inactive');
    }

    if (keyRecord.expiresAt && keyRecord.expiresAt < new Date()) {
      throw new UnauthorizedException('API key has expired');
    }

    keyRecord.lastUsedAt = new Date();
    await this.apiKeyRepository.save(keyRecord);

    request.organization = keyRecord.organization;
    request.project = keyRecord.project;
    request.apiKey = keyRecord;

    return true;
  }

  private extractApiKey(request: any): string | null {
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      // Check if it's an API key (starts with bg_) or JWT (has dots and structure)
      if (token.startsWith('bg_')) {
        return token;
      }
      // If it doesn't look like an API key, return null to try JWT
      return null;
    }

    if (request.headers['x-api-key']) {
      return request.headers['x-api-key'];
    }

    if (request.query?.apiKey) {
      return request.query.apiKey;
    }

    return null;
  }

  private extractJwtToken(request: any): string | null {
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      // Check if it's a JWT (has dots and structure, doesn't start with bg_)
      if (!token.startsWith('bg_') && token.includes('.')) {
        return token;
      }
    }
    return null;
  }
}

