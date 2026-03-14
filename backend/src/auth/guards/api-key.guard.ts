import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiKey } from '../../entities/api-key.entity';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    @InjectRepository(ApiKey)
    private apiKeyRepository: Repository<ApiKey>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;
    const clientId = request.headers['x-client-id'];
    const signature = request.headers['x-signature'];
    const timestamp = request.headers['x-timestamp'];

    // Check if this is a write operation (POST, PATCH, DELETE) using client secret/key (HMAC)
    const isWriteOperation = ['POST', 'PATCH', 'DELETE'].includes(method);
    const isHmacAuth = !!(clientId && signature && timestamp);

    // Block write operations with client secret/key authentication
    if (isWriteOperation && isHmacAuth) {
      throw new ForbiddenException(
        'Client Secret/Client ID authentication is read-only. POST, PATCH, and DELETE operations require full API key authentication.',
      );
    }

    const apiKey = this.extractApiKey(request);

    if (!apiKey) {
      throw new UnauthorizedException('API key is required');
    }

    // Hash the provided key to compare with stored hash
    const keyHash = ApiKey.hashKey(apiKey);

    const keyRecord = await this.apiKeyRepository.findOne({
      where: { keyHash },
      relations: ['organization', 'project'],
    });

    // Also try to find by client_id if keyHash doesn't match (for backward compatibility)
    if (!keyRecord && apiKey.startsWith('bg_client_')) {
      const keyRecordByClientId = await this.apiKeyRepository.findOne({
        where: { clientId: apiKey },
        relations: ['organization', 'project'],
      });
      if (keyRecordByClientId) {
        // For client_id based auth, require HMAC signature
        throw new UnauthorizedException(
          'Client ID authentication requires HMAC signature. Use X-Client-Id, X-Signature, and X-Timestamp headers.',
        );
      }
    }

    if (!keyRecord) {
      throw new UnauthorizedException('Invalid API key');
    }

    if (!keyRecord.active) {
      throw new UnauthorizedException('API key is inactive');
    }

    if (keyRecord.expiresAt && keyRecord.expiresAt < new Date()) {
      throw new UnauthorizedException('API key has expired');
    }

    // Update last used timestamp
    keyRecord.lastUsedAt = new Date();
    await this.apiKeyRepository.save(keyRecord);

    // Attach organization and project to request for use in controllers
    request.organization = keyRecord.organization;
    request.project = keyRecord.project;
    request.apiKey = keyRecord;

    return true;
  }

  private extractApiKey(request: any): string | null {
    // Check Authorization header: Bearer <api-key>
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // Check X-API-Key header
    if (request.headers['x-api-key']) {
      return request.headers['x-api-key'];
    }

    // Check query parameter
    if (request.query?.apiKey) {
      return request.query.apiKey;
    }

    return null;
  }
}

