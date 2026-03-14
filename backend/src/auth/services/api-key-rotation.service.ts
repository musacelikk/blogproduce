import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiKey } from '../../entities/api-key.entity';
import * as crypto from 'crypto';

@Injectable()
export class ApiKeyRotationService {
  constructor(
    @InjectRepository(ApiKey)
    private apiKeyRepository: Repository<ApiKey>,
  ) {}

  /**
   * Rotate API key: Create new key and disable old one
   * @param oldApiKeyId The ID of the API key to rotate
   * @returns New API key (plaintext, only shown once)
   */
  async rotateApiKey(oldApiKeyId: string): Promise<{
    oldKeyId: string;
    newKey: {
      id: string;
      apiKey: string;
      clientId: string;
      clientSecret: string;
      name: string;
      createdAt: Date;
    };
  }> {
    // Find old API key
    const oldApiKey = await this.apiKeyRepository.findOne({
      where: { id: oldApiKeyId },
      relations: ['organization', 'project'],
    });

    if (!oldApiKey) {
      throw new NotFoundException('API key not found');
    }

    // Disable old key
    oldApiKey.active = false;
    await this.apiKeyRepository.save(oldApiKey);

    // Create new key with same settings
    const randomBytes = crypto.randomBytes(32);
    const newApiKey = `bg_${randomBytes.toString('hex')}`;
    const keyHash = ApiKey.hashKey(newApiKey);

    const clientSecret = ApiKey.generateClientSecret();
    const clientSecretHash = ApiKey.hashKey(clientSecret);

    const newKeyRecord = this.apiKeyRepository.create({
      keyHash: keyHash,
      clientId: ApiKey.generateClientId(),
      clientSecretHash: clientSecretHash,
      organizationId: oldApiKey.organizationId,
      projectId: oldApiKey.projectId,
      name: `${oldApiKey.name} (rotated)`,
      expiresAt: oldApiKey.expiresAt,
      active: true,
      // Copy rate limiting settings
      requestsPerMinute: oldApiKey.requestsPerMinute,
      dailyGenerateLimit: oldApiKey.dailyGenerateLimit,
      monthlyTokenBudget: oldApiKey.monthlyTokenBudget,
      currentMonthTokensUsed: 0, // Reset token usage
      currentMonthResetDate: null, // Will be set on first use
    });

    const savedKey = await this.apiKeyRepository.save(newKeyRecord);

    return {
      oldKeyId: oldApiKey.id,
      newKey: {
        id: savedKey.id,
        apiKey: newApiKey, // Return plaintext only once
        clientId: savedKey.clientId,
        clientSecret: clientSecret, // Return plaintext only once
        name: savedKey.name,
        createdAt: savedKey.createdAt,
      },
    };
  }
}

