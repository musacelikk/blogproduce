import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
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
    const apiKey = this.extractApiKey(request);

    if (!apiKey) {
      throw new UnauthorizedException(
        'API key is required. Send it as "Authorization: Bearer bg_secret_..." or the X-API-Key header.',
      );
    }

    // Hash the provided key to compare with stored hash
    const keyHash = ApiKey.hashKey(apiKey);

    const keyRecord = await this.apiKeyRepository.findOne({
      where: { keyHash },
      relations: ['organization', 'project'],
    });

    // A client id is a public identifier, not a credential — reject it clearly
    // rather than letting it fall through to a generic "invalid API key".
    if (!keyRecord && apiKey.startsWith('bg_client_')) {
      throw new UnauthorizedException(
        'This is a client ID, not an API key. Authenticate with your secret key (bg_secret_...).',
      );
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

