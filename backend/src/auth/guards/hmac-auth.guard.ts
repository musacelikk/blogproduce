import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiKey } from '../../entities/api-key.entity';
import { ApiKeySecret } from '../../entities/api-key-secret.entity';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class HmacAuthGuard implements CanActivate {
  private readonly encryptionKey: string;

  constructor(
    @InjectRepository(ApiKey)
    private apiKeyRepository: Repository<ApiKey>,
    @InjectRepository(ApiKeySecret)
    private apiKeySecretRepository: Repository<ApiKeySecret>,
    private configService: ConfigService,
  ) {
    this.encryptionKey = this.configService.get<string>('API_KEY_ENCRYPTION_KEY') || 
      crypto.randomBytes(32).toString('hex');
    
    if (!this.configService.get<string>('API_KEY_ENCRYPTION_KEY')) {
      // Log warning but don't throw error - use random key for development
      console.warn('API_KEY_ENCRYPTION_KEY not set, using random key (not persistent across restarts!)');
    }
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    
    const clientId = request.headers['x-client-id'];
    const signature = request.headers['x-signature'];
    const timestamp = request.headers['x-timestamp'];

    if (!clientId || !signature || !timestamp) {
      throw new UnauthorizedException(
        'HMAC authentication requires X-Client-Id, X-Signature, and X-Timestamp headers',
      );
    }

    // Validate timestamp (prevent replay attacks)
    const requestTime = parseInt(timestamp, 10);
    if (isNaN(requestTime)) {
      throw new BadRequestException('Invalid timestamp format');
    }

    const now = Date.now();
    const timeDiff = Math.abs(now - requestTime);
    const maxTimeDiff = 5 * 60 * 1000; // 5 minutes

    if (timeDiff > maxTimeDiff) {
      throw new UnauthorizedException('Request timestamp is too old or too far in the future');
    }

    // Find API key by client_id
    const keyRecord = await this.apiKeyRepository.findOne({
      where: { clientId },
      relations: ['organization', 'project'],
    });

    if (!keyRecord) {
      throw new UnauthorizedException('Invalid client ID');
    }

    if (!keyRecord.active) {
      throw new UnauthorizedException('API key is inactive');
    }

    if (keyRecord.expiresAt && keyRecord.expiresAt < new Date()) {
      throw new UnauthorizedException('API key has expired');
    }

    // Get encrypted secret for HMAC verification
    const secretRecord = await this.apiKeySecretRepository.findOne({
      where: { apiKeyId: keyRecord.id },
    });

    if (!secretRecord) {
      throw new UnauthorizedException('HMAC secret not found for this API key');
    }

    // Decrypt client_secret
    const clientSecret = ApiKeySecret.decryptSecret(
      secretRecord.encryptedSecret,
      secretRecord.iv,
      this.encryptionKey,
    );

    // Get request body
    const body = request.body ? JSON.stringify(request.body) : '';
    const message = `${body}${timestamp}`;

    // Verify HMAC signature
    const isValid = HmacAuthGuard.verifySignature(clientSecret, message, signature);

    if (!isValid) {
      throw new UnauthorizedException('Invalid HMAC signature');
    }

    // Update last used timestamp
    keyRecord.lastUsedAt = new Date();
    await this.apiKeyRepository.save(keyRecord);

    // Attach organization and project to request
    request.organization = keyRecord.organization;
    request.project = keyRecord.project;
    request.apiKey = keyRecord;

    return true;
  }

  // Helper method to verify HMAC signature
  static verifySignature(
    secret: string,
    message: string,
    signature: string,
  ): boolean {
    try {
      const hmac = crypto.createHmac('sha256', secret);
      hmac.update(message);
      const expectedSignature = hmac.digest('hex');
      
      // Use timing-safe comparison to prevent timing attacks
      if (signature.length !== expectedSignature.length) {
        return false;
      }
      
      return crypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(expectedSignature, 'hex'),
      );
    } catch (error) {
      return false;
    }
  }
}
