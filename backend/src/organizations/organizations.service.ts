import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from '../entities/organization.entity';
import { Project } from '../entities/project.entity';
import { ApiKey } from '../entities/api-key.entity';
import { ApiKeySecret } from '../entities/api-key-secret.entity';
import { User } from '../entities/user.entity';
import { CreateApiKeyDto } from '../workspaces/dto/create-api-key.dto';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class OrganizationsService {
  private readonly logger = new Logger(OrganizationsService.name);
  private readonly encryptionKey: string;

  constructor(
    @InjectRepository(Organization)
    private organizationsRepository: Repository<Organization>,
    @InjectRepository(Project)
    private projectsRepository: Repository<Project>,
    @InjectRepository(ApiKey)
    private apiKeyRepository: Repository<ApiKey>,
    @InjectRepository(ApiKeySecret)
    private apiKeySecretRepository: Repository<ApiKeySecret>,
    private configService: ConfigService,
  ) {
    // Get encryption key from environment (32 bytes = 64 hex chars for AES-256)
    this.encryptionKey = this.configService.get<string>('API_KEY_ENCRYPTION_KEY') || 
      crypto.randomBytes(32).toString('hex');
    
    if (!this.configService.get<string>('API_KEY_ENCRYPTION_KEY')) {
      this.logger.warn('API_KEY_ENCRYPTION_KEY not set, using random key (not persistent!)');
    }
  }

  async createApiKey(
    organizationId: string,
    projectId: string,
    user: User,
    dto: CreateApiKeyDto,
  ) {
    // Verify organization ownership
    const organization = await this.organizationsRepository.findOne({
      where: { id: organizationId, ownerId: user.id },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found or access denied');
    }

    // Verify project belongs to organization
    const project = await this.projectsRepository.findOne({
      where: { id: projectId, organizationId: organization.id },
    });

    if (!project) {
      throw new NotFoundException('Project not found or does not belong to organization');
    }

    // Generate API key (plaintext - shown only once)
    const randomBytes = crypto.randomBytes(32);
    const apiKey = `bg_${randomBytes.toString('hex')}`;
    const keyHash = ApiKey.hashKey(apiKey);

    // Generate client_id and client_secret
    const clientId = ApiKey.generateClientId();
    const clientSecret = ApiKey.generateClientSecret();
    const clientSecretHash = ApiKey.hashKey(clientSecret);

    // Create API key record
    const keyRecord = this.apiKeyRepository.create({
      keyHash,
      clientId,
      clientSecretHash,
      organizationId: organization.id,
      projectId: project.id,
      name: dto.name || 'API Key',
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      active: true,
    });

    const savedKey = await this.apiKeyRepository.save(keyRecord);

    // Encrypt and store client_secret for HMAC verification
    const { encrypted, iv } = ApiKeySecret.encryptSecret(clientSecret, this.encryptionKey);
    
    const secretRecord = this.apiKeySecretRepository.create({
      apiKeyId: savedKey.id,
      encryptedSecret: encrypted,
      iv: iv,
    });

    await this.apiKeySecretRepository.save(secretRecord);

    // Return keys (shown only once!)
    return {
      id: savedKey.id,
      apiKey: apiKey, // Plaintext API key (Bearer token)
      clientId: clientId, // For HMAC authentication
      clientSecret: clientSecret, // For HMAC signing (shown only once!)
      name: savedKey.name,
      expiresAt: savedKey.expiresAt,
      createdAt: savedKey.createdAt,
      warning: 'Store these credentials securely. They will not be shown again.',
    };
  }

  async listApiKeys(organizationId: string, projectId: string, user: User) {
    const organization = await this.organizationsRepository.findOne({
      where: { id: organizationId, ownerId: user.id },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found or access denied');
    }

    const keys = await this.apiKeyRepository.find({
      where: {
        organizationId: organization.id,
        projectId: projectId,
      },
      order: { createdAt: 'DESC' },
    });

    // Don't return sensitive data
    return keys.map((key) => ({
      id: key.id,
      clientId: key.clientId,
      name: key.name,
      keyPreview: 'bg_...****', // Never show the actual key
      lastUsedAt: key.lastUsedAt,
      expiresAt: key.expiresAt,
      active: key.active,
      createdAt: key.createdAt,
    }));
  }

  async revokeApiKey(organizationId: string, projectId: string, user: User, apiKeyId: string) {
    const organization = await this.organizationsRepository.findOne({
      where: { id: organizationId, ownerId: user.id },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found or access denied');
    }

    const apiKey = await this.apiKeyRepository.findOne({
      where: {
        id: apiKeyId,
        organizationId: organization.id,
        projectId: projectId,
      },
    });

    if (!apiKey) {
      throw new NotFoundException('API key not found');
    }

    apiKey.active = false;
    await this.apiKeyRepository.save(apiKey);

    // Also delete the encrypted secret
    await this.apiKeySecretRepository.delete({ apiKeyId: apiKey.id });

    return { message: 'API key revoked successfully' };
  }
}

