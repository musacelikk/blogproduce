import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Workspace } from '../entities/workspace.entity';
import { User } from '../entities/user.entity';
import { Post } from '../entities/post.entity';
import { ApiKey } from '../entities/api-key.entity';
import { Webhook } from '../entities/webhook.entity';
import { Organization } from '../entities/organization.entity';
import { Project } from '../entities/project.entity';
import { PlanDefinition } from '../entities/plan-definition.entity';
import { Subscription, SubscriptionStatus } from '../entities/subscription.entity';
import { CreateWebhookDto } from './dto/create-webhook.dto';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { ApiKeyRotationService } from '../auth/services/api-key-rotation.service';
import * as crypto from 'crypto';

@Injectable()
export class WorkspacesService {
  constructor(
    @InjectRepository(Workspace)
    private workspacesRepository: Repository<Workspace>,
    @InjectRepository(Post)
    private postsRepository: Repository<Post>,
    @InjectRepository(ApiKey)
    private apiKeyRepository: Repository<ApiKey>,
    @InjectRepository(Webhook)
    private webhooksRepository: Repository<Webhook>,
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
    @InjectRepository(PlanDefinition)
    private planRepository: Repository<PlanDefinition>,
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
    private apiKeyRotationService: ApiKeyRotationService,
  ) {}

  async create(user: User, createWorkspaceDto: CreateWorkspaceDto) {
    // Kullanıcının mevcut workspace sayısını kontrol et
    const existingWorkspacesCount = await this.workspacesRepository.count({
      where: { ownerId: user.id },
    });

    // Kullanıcının aktif planını kontrol et
    let userPlan: PlanDefinition | null = null;
    
    // Önce aktif subscription'ı kontrol et
    const activeSubscription = await this.subscriptionRepository.findOne({
      where: {
        userId: user.id,
        status: SubscriptionStatus.ACTIVE,
      },
      relations: ['plan'],
      order: { startedAt: 'DESC' },
    });

    if (activeSubscription && activeSubscription.plan) {
      userPlan = activeSubscription.plan;
    } else if (user.planId) {
      // Eğer subscription yoksa ama user.planId varsa, planı direkt al
      userPlan = await this.planRepository.findOne({
        where: { id: user.planId },
      });
    }

    // Plan limitini kontrol et
    let maxWorkspaces: number | 'unlimited' = 1; // Varsayılan: 1 workspace (ücretsiz plan)
    
    if (userPlan) {
      maxWorkspaces = userPlan.features.maxWorkspaces;
    }

    // Limit kontrolü
    if (maxWorkspaces !== 'unlimited') {
      if (existingWorkspacesCount >= maxWorkspaces) {
        throw new BadRequestException(
          `Planınız ${maxWorkspaces} workspace oluşturmanıza izin veriyor. Daha fazla workspace oluşturmak için planınızı yükseltebilirsiniz.`,
        );
      }
    }

    const workspace = this.workspacesRepository.create({
      ...createWorkspaceDto,
      ownerId: user.id,
    });
    return this.workspacesRepository.save(workspace);
  }

  async findAll(user: User) {
    const workspaces = await this.workspacesRepository.find({
      where: { ownerId: user.id },
      relations: ['sites'],
    });

    // Eğer workspace yoksa, otomatik olarak bir workspace oluştur
    if (workspaces.length === 0) {
      const defaultWorkspace = this.workspacesRepository.create({
        name: 'Ana Workspace',
        description: 'Varsayılan çalışma alanı',
        ownerId: user.id,
      });
      const savedWorkspace = await this.workspacesRepository.save(defaultWorkspace);
      
      // Relation'ları yüklemek için tekrar sorgula
      return this.workspacesRepository.find({
        where: { id: savedWorkspace.id },
        relations: ['sites'],
      });
    }

    return workspaces;
  }

  async findOne(id: string, user: User) {
    const workspace = await this.workspacesRepository.findOne({
      where: { id, ownerId: user.id },
      relations: ['sites'],
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    return workspace;
  }

  async update(id: string, user: User, updateWorkspaceDto: UpdateWorkspaceDto) {
    const workspace = await this.findOne(id, user);
    Object.assign(workspace, updateWorkspaceDto);
    return this.workspacesRepository.save(workspace);
  }

  async remove(id: string, user: User, force: boolean = false) {
    const workspace = await this.findOne(id, user);
    
    // Check if workspace has posts
    const postCount = await this.postsRepository.count({
      where: { workspaceId: id },
    });

    if (postCount > 0 && !force) {
      throw new BadRequestException(
        `Bu workspace'te ${postCount} blog bulunmaktadır.`
      );
    }

    // If force is true, delete all posts first
    if (force && postCount > 0) {
      await this.postsRepository.delete({ workspaceId: id });
    }

    await this.workspacesRepository.remove(workspace);
    return { message: 'Workspace deleted successfully', deletedPosts: force ? postCount : 0 };
  }

  async createApiKey(workspaceId: string, user: User, dto: CreateApiKeyDto) {
    const workspace = await this.findOne(workspaceId, user);
    
    // Find or create Organization for this workspace
    // ✅ Use workspace ID to ensure uniqueness - each workspace gets its own organization
    // First try to find by a unique identifier (we'll use workspace ID in name or create a unique name)
    // Since organization doesn't have workspaceId field, we'll use a unique naming pattern
    const organizationName = `${workspace.name} (${workspace.id})`;
    let organization = await this.organizationRepository.findOne({
      where: { ownerId: user.id, name: organizationName },
    });

    if (!organization) {
      organization = this.organizationRepository.create({
        name: organizationName,
        description: workspace.description || `Organization for ${workspace.name}`,
        ownerId: user.id,
        active: true,
      });
      organization = await this.organizationRepository.save(organization);
    }

    // Find or create Project for this workspace
    // ✅ Use workspace.id as project slug to match with blog posts (posts use workspaceId as project slug)
    const projectSlug = workspace.id; // Use workspace ID as project slug to match with posts
    let project = await this.projectRepository.findOne({
      where: { organizationId: organization.id, slug: projectSlug },
    });

    if (!project) {
      project = this.projectRepository.create({
        organizationId: organization.id,
        name: workspace.name,
        slug: projectSlug, // Use workspace.id as slug to match with posts
        description: workspace.description || `Project for ${workspace.name}`,
        active: true,
      });
      project = await this.projectRepository.save(project);
    }
    
    // Generate API key: bg_ prefix + random 32 bytes hex
    const randomBytes = crypto.randomBytes(32);
    const apiKey = `bg_${randomBytes.toString('hex')}`;

    // Hash the API key for storage
    const keyHash = ApiKey.hashKey(apiKey);
    
    // Generate client secret
    const clientSecret = ApiKey.generateClientSecret();
    const clientSecretHash = ApiKey.hashKey(clientSecret);
    
    const keyRecord = this.apiKeyRepository.create({
      keyHash: keyHash,
      clientId: ApiKey.generateClientId(),
      clientSecretHash: clientSecretHash,
      organizationId: organization.id,
      projectId: project.id,
      name: dto.name || 'API Key',
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      active: true,
    });

    const savedKey = await this.apiKeyRepository.save(keyRecord) as unknown as ApiKey;
    
    return {
      id: savedKey.id,
      apiKey: apiKey, // Return plaintext key only on creation
      clientId: savedKey.clientId,
      clientSecret: clientSecret, // Return plaintext secret only on creation
      name: savedKey.name,
      expiresAt: savedKey.expiresAt,
      createdAt: savedKey.createdAt,
    };
  }

  async listApiKeys(workspaceId: string, user: User) {
    const workspace = await this.findOne(workspaceId, user);
    
    // Find Organization for this workspace
    const organization = await this.organizationRepository.findOne({
      where: { ownerId: user.id, name: workspace.name },
    });

    if (!organization) {
      return []; // No organization means no API keys
    }

    // Find Project for this workspace
    // ✅ Use workspace.id as project slug to match with blog posts
    const projectSlug = workspace.id; // Use workspace ID as project slug to match with posts
    const project = await this.projectRepository.findOne({
      where: { organizationId: organization.id, slug: projectSlug },
    });

    if (!project) {
      return []; // No project means no API keys
    }
    
    // Find keys by organizationId and projectId
    const keys = await this.apiKeyRepository.find({
      where: { 
        organizationId: organization.id,
        projectId: project.id,
      },
      order: { createdAt: 'DESC' },
    });

    return keys.map((key) => ({
      id: key.id,
      clientId: key.clientId,
      name: key.name,
      keyPreview: 'bg_...****', // Never show actual key
      lastUsedAt: key.lastUsedAt,
      expiresAt: key.expiresAt,
      active: key.active,
      createdAt: key.createdAt,
    }));
  }

  async revokeApiKey(workspaceId: string, user: User, apiKeyId: string) {
    const workspace = await this.findOne(workspaceId, user);
    
    // Find Organization for this workspace
    const organization = await this.organizationRepository.findOne({
      where: { ownerId: user.id, name: workspace.name },
    });

    if (!organization) {
      throw new NotFoundException('API key not found');
    }

    // Find Project for this workspace
    // ✅ Use workspace.id as project slug to match with blog posts
    const projectSlug = workspace.id; // Use workspace ID as project slug to match with posts
    const project = await this.projectRepository.findOne({
      where: { organizationId: organization.id, slug: projectSlug },
    });

    if (!project) {
      throw new NotFoundException('API key not found');
    }
    
    // Find key by organizationId and projectId
    const apiKey = await this.apiKeyRepository.findOne({
      where: { 
        id: apiKeyId,
        organizationId: organization.id,
        projectId: project.id,
      },
    });

    if (!apiKey) {
      throw new NotFoundException('API key not found');
    }

    apiKey.active = false;
    await this.apiKeyRepository.save(apiKey);

    return { message: 'API key revoked successfully' };
  }

  async rotateApiKey(workspaceId: string, user: User, apiKeyId: string) {
    const workspace = await this.findOne(workspaceId, user);
    
    // Find Organization for this workspace
    const organization = await this.organizationRepository.findOne({
      where: { ownerId: user.id },
    });

    if (!organization) {
      throw new NotFoundException('API key not found');
    }

    // Find Project for this workspace
    const projectSlug = workspace.id; // Use workspace ID as project slug
    const project = await this.projectRepository.findOne({
      where: { organizationId: organization.id, slug: projectSlug },
    });

    if (!project) {
      throw new NotFoundException('API key not found');
    }
    
    // Verify the API key belongs to this organization/project
    const apiKey = await this.apiKeyRepository.findOne({
      where: { 
        id: apiKeyId,
        organizationId: organization.id,
        projectId: project.id,
      },
    });

    if (!apiKey) {
      throw new NotFoundException('API key not found');
    }

    // Rotate the key
    return this.apiKeyRotationService.rotateApiKey(apiKeyId);
  }

  async createWebhook(workspaceId: string, user: User, dto: CreateWebhookDto) {
    const workspace = await this.findOne(workspaceId, user);
    
    // Legacy: workspaceId is kept for backward compatibility but should be migrated
    // New webhooks should use organizationId and projectId
    const webhook = this.webhooksRepository.create({
      workspaceId: workspace.id, // Legacy field
      organizationId: workspace.id, // Temporary: use workspace.id as organizationId
      projectId: workspace.id, // Temporary: use workspace.id as projectId
      url: dto.url,
      events: dto.events,
      secret: dto.secret || null,
      active: true,
    });

    const savedWebhook = await this.webhooksRepository.save(webhook) as unknown as Webhook;
    
    return {
      id: savedWebhook.id,
      url: savedWebhook.url,
      events: savedWebhook.events,
      active: savedWebhook.active,
      createdAt: savedWebhook.createdAt,
    };
  }

  async listWebhooks(workspaceId: string, user: User) {
    const workspace = await this.findOne(workspaceId, user);
    
    // Legacy: Find webhooks by workspaceId (backward compatibility)
    const webhooks = await this.webhooksRepository.find({
      where: { 
        workspaceId: workspace.id, // Legacy field
        organizationId: workspace.id, // Temporary: use workspace.id as organizationId
        projectId: workspace.id, // Temporary: use workspace.id as projectId
      },
      order: { createdAt: 'DESC' },
    });

    return webhooks.map((webhook) => ({
      id: webhook.id,
      url: webhook.url,
      events: webhook.events,
      active: webhook.active,
      lastTriggeredAt: webhook.lastTriggeredAt,
      failureCount: webhook.failureCount,
      createdAt: webhook.createdAt,
    }));
  }

  async updateWebhook(workspaceId: string, user: User, webhookId: string, dto: Partial<CreateWebhookDto>) {
    const workspace = await this.findOne(workspaceId, user);
    
    // Legacy: Find webhook by workspaceId (backward compatibility)
    const webhook = await this.webhooksRepository.findOne({
      where: { 
        id: webhookId,
        workspaceId: workspace.id, // Legacy field
        organizationId: workspace.id, // Temporary: use workspace.id as organizationId
        projectId: workspace.id, // Temporary: use workspace.id as projectId
      },
    });

    if (!webhook) {
      throw new NotFoundException('Webhook not found');
    }

    if (dto.url) webhook.url = dto.url;
    if (dto.events) webhook.events = dto.events;
    if (dto.secret !== undefined) webhook.secret = dto.secret;

    await this.webhooksRepository.save(webhook);

    return {
      id: webhook.id,
      url: webhook.url,
      events: webhook.events,
      active: webhook.active,
    };
  }

  async deleteWebhook(workspaceId: string, user: User, webhookId: string) {
    const workspace = await this.findOne(workspaceId, user);
    
    // Legacy: Find webhook by workspaceId (backward compatibility)
    const webhook = await this.webhooksRepository.findOne({
      where: { 
        id: webhookId,
        workspaceId: workspace.id, // Legacy field
        organizationId: workspace.id, // Temporary: use workspace.id as organizationId
        projectId: workspace.id, // Temporary: use workspace.id as projectId
      },
    });

    if (!webhook) {
      throw new NotFoundException('Webhook not found');
    }

    await this.webhooksRepository.remove(webhook);

    return { message: 'Webhook deleted successfully' };
  }
}
