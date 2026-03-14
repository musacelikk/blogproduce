import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, MoreThan } from 'typeorm';
import { Post, PostStatus, PostLanguage } from '../entities/post.entity';
import { Organization } from '../entities/organization.entity';
import { Project } from '../entities/project.entity';
import { PostRevision, ContentFormat, ContentEditor } from '../entities/post-revision.entity';
import { Webhook, WebhookEvent } from '../entities/webhook.entity';
import { GenerationJob, JobStatus } from '../entities/generation-job.entity';
import { UsageEvent, UsageEventType } from '../entities/usage-event.entity';
import { IdempotencyKey } from '../entities/idempotency-key.entity';
import { GenerateApiDto } from './dto/generate-api.dto';
import { PublishApiDto } from './dto/publish-api.dto';
import { UpdatePostApiDto } from './dto/update-post-api.dto';
import { SqsService } from '../queue/sqs.service';
import { PostsService } from '../posts/posts.service';
import { convertContentFormat, parseFormat, markdownToJson } from '../common/utils/content-format.util';
import * as crypto from 'crypto';

@Injectable()
export class ApiService {
  private readonly logger = new Logger(ApiService.name);

  constructor(
    @InjectRepository(Post)
    private postsRepository: Repository<Post>,
    @InjectRepository(PostRevision)
    private postRevisionsRepository: Repository<PostRevision>,
    @InjectRepository(Organization)
    private organizationsRepository: Repository<Organization>,
    @InjectRepository(Project)
    private projectsRepository: Repository<Project>,
    @InjectRepository(Webhook)
    private webhooksRepository: Repository<Webhook>,
    @InjectRepository(GenerationJob)
    private generationJobsRepository: Repository<GenerationJob>,
    @InjectRepository(UsageEvent)
    private usageEventsRepository: Repository<UsageEvent>,
    @InjectRepository(IdempotencyKey)
    private idempotencyKeysRepository: Repository<IdempotencyKey>,
    private sqsService: SqsService,
    private postsService: PostsService,
  ) {}

  async generate(
    organization: Organization,
    project: Project,
    dto: GenerateApiDto,
    idempotencyKey?: string,
  ) {
    try {
      // Check idempotency if key provided
      if (idempotencyKey) {
        const requestHash = this.hashRequest(dto);
        const existingKey = await this.idempotencyKeysRepository.findOne({
          where: {
            organizationId: organization.id,
            projectId: project.id,
            key: idempotencyKey,
            expiresAt: MoreThan(new Date()),
          },
        });

        if (existingKey && existingKey.requestHash === requestHash) {
          // Return cached response
          this.logger.log(`Idempotency key hit: ${idempotencyKey}`);
          return existingKey.response.body;
        }
      }

      // Generate slug from topic
      const slug = dto.topic
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .substring(0, 100);

      // Parse cover image credit JSON if provided
      let coverImageCreditJson: { name: string; photographerUrl: string; photoUrl: string } | null = null;
      if (dto.coverImageCreditJson) {
        try {
          coverImageCreditJson = JSON.parse(dto.coverImageCreditJson);
        } catch (e) {
          this.logger.warn('Invalid coverImageCreditJson format', e);
        }
      }

      // Create post with QUEUED status
      const postData: any = {
        title: dto.topic,
        slug: `${slug}-${Date.now()}`,
        organizationId: organization.id,
        projectId: project.id,
        authorId: organization.ownerId,
        language: dto.language || PostLanguage.TR,
        status: PostStatus.QUEUED,
      };

      if (dto.coverImageUrl) {
        postData.coverImageUrl = dto.coverImageUrl;
      }
      if (coverImageCreditJson) {
        postData.coverImageCreditJson = coverImageCreditJson;
      }

      const post = this.postsRepository.create(postData);
      const savedPost = await this.postsRepository.save(post) as unknown as Post;

      // Create generation job record
      const job = this.generationJobsRepository.create({
        organizationId: organization.id,
        projectId: project.id,
        postId: savedPost.id,
        status: JobStatus.PENDING,
        startedAt: new Date(),
        requestData: {
          topic: dto.topic,
          language: dto.language,
          tone: dto.tone,
          keywords: dto.keywords,
          outline: dto.outline,
          length: dto.length,
          sources: dto.sources,
          seo: dto.seo,
          options: dto.options,
          seoMode: dto.seoMode,
          model: dto.model,
          additionalContext: dto.additionalContext,
          targetAudience: dto.targetAudience,
        },
      });
      const savedJob = await this.generationJobsRepository.save(job);

      // Send message to SQS
      const languageValue = dto.language || PostLanguage.TR;
      
      await this.sqsService.sendGeneratePostMessage({
        jobId: savedJob.id, // Include jobId for idempotency
        postId: savedPost.id,
        workspaceId: project.id, // Keep for backward compatibility
        language: languageValue as string,
        topic: dto.topic,
        tone: dto.tone || 'professional',
        length: dto.length || 'medium',
        seoMode: dto.seoMode || false,
        model: dto.model || 'gpt-4.1-mini',
        additionalContext: dto.additionalContext,
        targetAudience: dto.targetAudience,
        // Always generate canonical JSON; we convert to other formats for clients
        format: ContentFormat.JSON,
      });

      // Record usage event
      await this.recordUsageEvent(organization.id, project.id, savedPost.id, UsageEventType.POST_GENERATED, {
        model: dto.model || 'gpt-4.1-mini',
      });

      // Trigger webhook for POST_GENERATED event
      await this.triggerWebhook(organization.id, project.id, WebhookEvent.POST_GENERATED, {
        postId: savedPost.id,
        jobId: savedJob.id,
        status: savedPost.status,
        topic: dto.topic,
      });

      const response = {
        jobId: savedJob.id,
        status: 'queued' as const,
      };

      // Store idempotency key if provided
      if (idempotencyKey) {
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours

        const idempotencyRecord = this.idempotencyKeysRepository.create({
          organizationId: organization.id,
          projectId: project.id,
          key: idempotencyKey,
          requestHash: this.hashRequest(dto),
          response: {
            statusCode: 200,
            body: response,
          },
          expiresAt,
        });
        await this.idempotencyKeysRepository.save(idempotencyRecord);
      }

      return response;
    } catch (error) {
      this.logger.error('Error generating post via API', error);
      throw error;
    }
  }

  private hashRequest(dto: any): string {
    // Create deterministic hash of request
    const normalized = JSON.stringify(dto, Object.keys(dto).sort());
    return crypto.createHash('sha256').update(normalized).digest('hex');
  }

  async getJob(organization: Organization, project: Project, jobId: string) {
    try {
      const job = await this.generationJobsRepository.findOne({
        where: {
          id: jobId,
          organizationId: organization.id,
          projectId: project.id,
        },
        relations: ['post'],
      });

      if (!job) {
        throw new NotFoundException('Job not found');
      }

      const statusMap: Record<JobStatus, string> = {
        [JobStatus.PENDING]: 'queued',
        [JobStatus.PROCESSING]: 'running',
        [JobStatus.COMPLETED]: 'succeeded',
        [JobStatus.FAILED]: 'failed',
        [JobStatus.CANCELLED]: 'cancelled',
      };

      const response: any = {
        status: statusMap[job.status] || job.status,
      };

      if (job.status === JobStatus.PROCESSING) {
        // Calculate progress if available
        response.progress = job.processingTimeMs ? Math.min(100, (job.processingTimeMs / 60000) * 100) : null;
      }

      if (job.error) {
        response.error = job.error;
      }

      if (job.postId) {
        response.postId = job.postId;
      }

      return response;
    } catch (error) {
      this.logger.error('Error getting job via API', error);
      throw error;
    }
  }

  async updatePost(organization: Organization, project: Project, postId: string, dto: UpdatePostApiDto) {
    try {
      const post = await this.postsRepository.findOne({
        where: {
          id: postId,
          organizationId: organization.id,
          projectId: project.id,
        },
        relations: ['revisions'],
      });

      if (!post) {
        throw new NotFoundException('Post not found');
      }

      // Only allow updating draft, generated, or review posts
      const allowedStatuses = [PostStatus.DRAFT, PostStatus.GENERATED, PostStatus.REVIEW];
      if (!allowedStatuses.includes(post.status)) {
        throw new BadRequestException(
          `Cannot update post with status: ${post.status}. Allowed statuses: ${allowedStatuses.join(', ')}`,
        );
      }

      // Update fields
      if (dto.title) post.title = dto.title;
      if (dto.excerpt !== undefined) post.excerpt = dto.excerpt;
      if (dto.slug) {
        // Check slug uniqueness
        const existingPost = await this.postsRepository.findOne({
          where: {
            organizationId: organization.id,
            projectId: project.id,
            slug: dto.slug,
          },
        });

        if (existingPost && existingPost.id !== post.id) {
          throw new BadRequestException('Slug already exists in this project');
        }

        post.slug = dto.slug;
      }

      const savedPost = await this.postsRepository.save(post);

      // Update content if provided
      if (dto.content) {
        const allRevisions = await this.postRevisionsRepository.find({
          where: { postId: savedPost.id },
          order: { version: 'DESC' },
        });

        const latestRevision = allRevisions[0];
        const contentChanged = !latestRevision || latestRevision.content !== dto.content;

        if (contentChanged) {
          const newVersion = latestRevision ? latestRevision.version + 1 : 1;

          // Convert content to JSON format if not already JSON
          let jsonContent = dto.content;
          try {
            // Try to parse as JSON, if fails, assume it's markdown and convert
            JSON.parse(dto.content);
            // Already valid JSON
          } catch {
            // Not JSON, convert markdown to JSON format
            const json = markdownToJson(dto.content);
            jsonContent = JSON.stringify(json);
          }

          const newRevision = this.postRevisionsRepository.create({
            postId: savedPost.id,
            version: newVersion,
            content: jsonContent,
            contentFormat: ContentFormat.JSON,
            editor: ContentEditor.HUMAN,
          });

          await this.postRevisionsRepository.save(newRevision);
        }
      }

      // Trigger webhook
      await this.triggerWebhook(organization.id, project.id, WebhookEvent.POST_UPDATED, {
        postId: savedPost.id,
        status: savedPost.status,
      });

      return {
        id: savedPost.id,
        title: savedPost.title,
        slug: savedPost.slug,
        status: savedPost.status,
        message: 'Post updated successfully',
      };
    } catch (error) {
      this.logger.error('Error updating post via API', error);
      throw error;
    }
  }

  async listPostsWithCursor(
    organization: Organization,
    project: Project,
    status?: PostStatus,
    limit: number = 50,
    cursor?: string,
  ) {
    try {
      const queryBuilder = this.postsRepository
        .createQueryBuilder('post')
        .leftJoinAndSelect('post.author', 'author')
        .leftJoinAndSelect('post.tags', 'tags')
        .where('post.organizationId = :organizationId', { organizationId: organization.id })
        .andWhere('post.projectId = :projectId', { projectId: project.id })
        .orderBy('post.createdAt', 'DESC')
        .take(Math.min(limit, 100) + 1); // Fetch one extra to check if there's more

      if (status) {
        queryBuilder.andWhere('post.status = :status', { status });
      }

      if (cursor) {
        // Decode cursor (base64 encoded timestamp)
        try {
          const cursorDate = new Date(Buffer.from(cursor, 'base64').toString());
          queryBuilder.andWhere('post.createdAt < :cursor', { cursor: cursorDate });
        } catch (e) {
          throw new BadRequestException('Invalid cursor format');
        }
      }

      const posts = await queryBuilder.getMany();
      const hasMore = posts.length > limit;
      const resultPosts = hasMore ? posts.slice(0, limit) : posts;

      // Generate next cursor
      const nextCursor = hasMore && resultPosts.length > 0
        ? Buffer.from(resultPosts[resultPosts.length - 1].createdAt.toISOString()).toString('base64')
        : null;

      return {
        posts: resultPosts.map((post) => ({
          id: post.id,
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          status: post.status,
          language: post.language,
          coverImageUrl: post.coverImageUrl,
          publishedAt: post.publishedAt,
          createdAt: post.createdAt,
          updatedAt: post.updatedAt,
          author: post.author
            ? {
                name: post.author.name,
                email: post.author.email,
              }
            : null,
          tags: post.tags || [],
        })),
        cursor: nextCursor,
        hasMore,
      };
    } catch (error) {
      this.logger.error('Error listing posts with cursor via API', error);
      throw error;
    }
  }

  async getPublicPostsByProjectSlug(projectSlug: string, limit: number = 50, cursor?: string) {
    try {
      const project = await this.projectsRepository.findOne({
        where: { slug: projectSlug },
        relations: ['organization'],
      });

      if (!project) {
        throw new NotFoundException('Project not found');
      }

      const queryBuilder = this.postsRepository
        .createQueryBuilder('post')
        .leftJoinAndSelect('post.author', 'author')
        .leftJoinAndSelect('post.tags', 'tags')
        .where('post.organizationId = :organizationId', { organizationId: project.organizationId })
        .andWhere('post.projectId = :projectId', { projectId: project.id })
        .andWhere('post.status = :status', { status: PostStatus.PUBLISHED })
        .orderBy('post.publishedAt', 'DESC')
        .take(Math.min(limit, 100) + 1);

      if (cursor) {
        try {
          const cursorDate = new Date(Buffer.from(cursor, 'base64').toString());
          queryBuilder.andWhere('post.publishedAt < :cursor', { cursor: cursorDate });
        } catch (e) {
          throw new BadRequestException('Invalid cursor format');
        }
      }

      const posts = await queryBuilder.getMany();
      const hasMore = posts.length > limit;
      const resultPosts = hasMore ? posts.slice(0, limit) : posts;

      const lastPost = resultPosts.length > 0 ? resultPosts[resultPosts.length - 1] : null;
      const nextCursor = hasMore && lastPost && lastPost.publishedAt
        ? Buffer.from(lastPost.publishedAt.toISOString()).toString('base64')
        : null;

      return {
        posts: resultPosts.map((post) => ({
          id: post.id,
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          language: post.language,
          coverImageUrl: post.coverImageUrl,
          publishedAt: post.publishedAt,
          author: post.author
            ? {
                name: post.author.name,
                email: post.author.email,
              }
            : null,
          tags: post.tags || [],
        })),
        cursor: nextCursor,
        hasMore,
      };
    } catch (error) {
      this.logger.error('Error getting public posts by project slug via API', error);
      throw error;
    }
  }

  async getPublicPostByProjectSlug(projectSlug: string, slug: string, format?: string) {
    try {
      const project = await this.projectsRepository.findOne({
        where: { slug: projectSlug },
      });

      if (!project) {
        throw new NotFoundException('Project not found');
      }

      const post = await this.postsRepository.findOne({
        where: {
          organizationId: project.organizationId,
          projectId: project.id,
          slug,
          status: PostStatus.PUBLISHED,
        },
        relations: ['author', 'tags', 'revisions'],
      });

      if (!post) {
        throw new NotFoundException('Post not found');
      }

      const latestRevision = post.revisions
        ? post.revisions.sort((a, b) => b.version - a.version)[0]
        : null;

      if (!latestRevision || !latestRevision.content) {
        return {
          id: post.id,
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          content: null,
          contentFormat: format || 'json',
          content_html: null,
          language: post.language,
          coverImageUrl: post.coverImageUrl,
          coverImageCreditJson: post.coverImageCreditJson,
          publishedAt: post.publishedAt,
          author: post.author
            ? {
                name: post.author.name,
                email: post.author.email,
              }
            : null,
          tags: post.tags || [],
          seo: post.seo || null,
        };
      }

      // Determine requested format (default: json)
      const requestedFormat = parseFormat(format) || ContentFormat.JSON;
      const storedFormat = latestRevision.contentFormat || ContentFormat.JSON;

      // Convert content format if needed
      let content = latestRevision.content;
      let contentFormat = storedFormat;

      if (requestedFormat !== storedFormat) {
        try {
          // If stored format is not JSON, convert to JSON first
          let jsonContent: string;
          if (storedFormat === ContentFormat.MD) {
            const json = markdownToJson(content);
            jsonContent = JSON.stringify(json);
          } else if (storedFormat === ContentFormat.HTML) {
            // HTML to JSON (store HTML as-is in content field)
            jsonContent = JSON.stringify({ content, metadata: { format: 'html' } });
          } else {
            jsonContent = content; // Already JSON
          }

          // Now convert from JSON to requested format
          content = convertContentFormat(jsonContent, ContentFormat.JSON, requestedFormat);
          contentFormat = requestedFormat;
        } catch (error) {
          this.logger.warn('Error converting content format', error);
          // If conversion fails, return as-is
        }
      }

      // Her zaman blog görünümü için HTML üret (sitelere tek istekte render edilebilir içerik)
      let contentHtml: string | null = null;
      if (content != null && content !== '') {
        try {
          contentHtml = convertContentFormat(content, contentFormat, ContentFormat.HTML);
        } catch {
          contentHtml = null;
        }
      }

      return {
        id: post.id,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        content,
        contentFormat,
        content_html: contentHtml,
        language: post.language,
        coverImageUrl: post.coverImageUrl,
        coverImageCreditJson: post.coverImageCreditJson,
        publishedAt: post.publishedAt,
        author: post.author
            ? {
                name: post.author.name,
                email: post.author.email,
              }
            : null,
        tags: post.tags || [],
        seo: post.seo || null,
      };
    } catch (error) {
      this.logger.error('Error getting public post by project slug via API', error);
      throw error;
    }
  }

  async publish(organization: Organization, project: Project, dto: PublishApiDto) {
    try {
      const post = await this.postsRepository.findOne({
        where: {
          id: dto.postId,
          organizationId: organization.id,
          projectId: project.id,
        },
      });

      if (!post) {
        throw new NotFoundException('Post not found');
      }

      // Only allow publishing from draft, generated, or review status
      const allowedStatuses = [PostStatus.DRAFT, PostStatus.GENERATED, PostStatus.REVIEW];
      if (!allowedStatuses.includes(post.status)) {
        throw new BadRequestException(
          `Cannot publish post with status: ${post.status}. Allowed statuses: ${allowedStatuses.join(', ')}`,
        );
      }

      // Check if post is hidden by admin
      if (post.hiddenByAdmin) {
        throw new ForbiddenException('Post is hidden by admin and cannot be published');
      }

      // Update slug if provided
      if (dto.slug) {
        // Check if slug is unique within organization + project
        const existingPost = await this.postsRepository.findOne({
          where: {
            organizationId: organization.id,
            projectId: project.id,
            slug: dto.slug,
          },
        });

        if (existingPost && existingPost.id !== post.id) {
          throw new BadRequestException('Slug already exists in this project');
        }

        post.slug = dto.slug;
      }

      // Update status to PUBLISHED
      post.status = PostStatus.PUBLISHED;
      post.publishedAt = new Date();

      const savedPost = await this.postsRepository.save(post);

      // Record usage event
      await this.recordUsageEvent(organization.id, project.id, savedPost.id, UsageEventType.POST_PUBLISHED);

      // Trigger webhook for POST_PUBLISHED event
      await this.triggerWebhook(organization.id, project.id, WebhookEvent.POST_PUBLISHED, {
        postId: savedPost.id,
        status: savedPost.status,
        slug: savedPost.slug,
        publishedAt: savedPost.publishedAt,
      });

      return {
        id: savedPost.id,
        status: savedPost.status,
        slug: savedPost.slug,
        publishedAt: savedPost.publishedAt,
        message: 'Post published successfully',
      };
    } catch (error) {
      this.logger.error('Error publishing post via API', error);
      throw error;
    }
  }

  async listPosts(organization: Organization, project: Project, status?: PostStatus, limit: number = 50) {
    try {
      const queryBuilder = this.postsRepository
        .createQueryBuilder('post')
        .leftJoinAndSelect('post.author', 'author')
        .leftJoinAndSelect('post.tags', 'tags')
        .where('post.organizationId = :organizationId', { organizationId: organization.id })
        .andWhere('post.projectId = :projectId', { projectId: project.id })
        .orderBy('post.createdAt', 'DESC')
        .take(Math.min(limit, 100)); // Max 100 posts

      if (status) {
        queryBuilder.andWhere('post.status = :status', { status });
      }

      const posts = await queryBuilder.getMany();

      return posts.map((post) => ({
        id: post.id,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        status: post.status,
        language: post.language,
        coverImageUrl: post.coverImageUrl,
        publishedAt: post.publishedAt,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        author: post.author
          ? {
              name: post.author.name,
              email: post.author.email,
            }
          : null,
        tags: post.tags || [],
      }));
    } catch (error) {
      this.logger.error('Error listing posts via API', error);
      throw error;
    }
  }

  async getPost(organization: Organization, project: Project, postId: string, format?: string) {
    try {
      const post = await this.postsRepository.findOne({
        where: {
          id: postId,
          organizationId: organization.id,
          projectId: project.id,
        },
        relations: ['author', 'tags', 'revisions'],
      });

      if (!post) {
        throw new NotFoundException('Post not found');
      }

      // Get latest revision content
      const latestRevision = post.revisions
        ? post.revisions.sort((a, b) => b.version - a.version)[0]
        : null;

      if (!latestRevision || !latestRevision.content) {
        return {
          id: post.id,
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          content: null,
          contentFormat: format || 'json',
          content_html: null,
          status: post.status,
          language: post.language,
          coverImageUrl: post.coverImageUrl,
          coverImageCreditJson: post.coverImageCreditJson,
          publishedAt: post.publishedAt,
          createdAt: post.createdAt,
          updatedAt: post.updatedAt,
          author: post.author
            ? {
                name: post.author.name,
                email: post.author.email,
              }
            : null,
          tags: post.tags || [],
          seo: post.seo || null,
        };
      }

      // Determine requested format (default: json)
      const requestedFormat = parseFormat(format) || ContentFormat.JSON;
      const storedFormat = latestRevision.contentFormat || ContentFormat.JSON;

      // Convert content format if needed
      let content = latestRevision.content;
      let contentFormat = storedFormat;

      if (requestedFormat !== storedFormat) {
        try {
          // If stored format is not JSON, convert to JSON first
          let jsonContent: string;
          if (storedFormat === ContentFormat.MD) {
            const json = markdownToJson(content);
            jsonContent = JSON.stringify(json);
          } else if (storedFormat === ContentFormat.HTML) {
            // HTML to JSON (store HTML as-is in content field)
            jsonContent = JSON.stringify({ content, metadata: { format: 'html' } });
          } else {
            jsonContent = content; // Already JSON
          }

          // Now convert from JSON to requested format
          content = convertContentFormat(jsonContent, ContentFormat.JSON, requestedFormat);
          contentFormat = requestedFormat;
        } catch (error) {
          this.logger.warn('Error converting content format', error);
          // If conversion fails, return as-is
        }
      }

      let contentHtml: string | null = null;
      if (content != null && content !== '') {
        try {
          contentHtml = convertContentFormat(content, contentFormat, ContentFormat.HTML);
        } catch {
          contentHtml = null;
        }
      }

      return {
        id: post.id,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        content,
        contentFormat,
        content_html: contentHtml,
        status: post.status,
        language: post.language,
        coverImageUrl: post.coverImageUrl,
        coverImageCreditJson: post.coverImageCreditJson,
        publishedAt: post.publishedAt,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        author: post.author
          ? {
              name: post.author.name,
              email: post.author.email,
            }
          : null,
        tags: post.tags || [],
        seo: post.seo || null,
      };
    } catch (error) {
      this.logger.error('Error getting post via API', error);
      throw error;
    }
  }

  async getPublishedPosts(organization: Organization, project: Project, limit: number = 50) {
    try {
      const posts = await this.postsRepository.find({
        where: {
          organizationId: organization.id,
          projectId: project.id,
          status: PostStatus.PUBLISHED,
        },
        relations: ['author', 'tags'],
        order: { publishedAt: 'DESC' },
        take: Math.min(limit, 100),
      });

      return posts.map((post) => ({
        id: post.id,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        language: post.language,
        coverImageUrl: post.coverImageUrl,
        publishedAt: post.publishedAt,
        author: post.author
          ? {
              name: post.author.name,
              email: post.author.email,
            }
          : null,
        tags: post.tags || [],
      }));
    } catch (error) {
      this.logger.error('Error getting published posts via API', error);
      throw error;
    }
  }

  async getPublishedPost(organization: Organization, project: Project, slug: string, format?: string) {
    try {
      const post = await this.postsRepository.findOne({
        where: {
          organizationId: organization.id,
          projectId: project.id,
          slug,
          status: PostStatus.PUBLISHED,
        },
        relations: ['author', 'tags', 'revisions'],
      });

      if (!post) {
        throw new NotFoundException('Post not found');
      }

      // Get latest revision content
      const latestRevision = post.revisions
        ? post.revisions.sort((a, b) => b.version - a.version)[0]
        : null;

      if (!latestRevision || !latestRevision.content) {
        return {
          id: post.id,
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          content: null,
          contentFormat: format || 'json',
          content_html: null,
          language: post.language,
          coverImageUrl: post.coverImageUrl,
          coverImageCreditJson: post.coverImageCreditJson,
          publishedAt: post.publishedAt,
          author: post.author
            ? {
                name: post.author.name,
                email: post.author.email,
              }
            : null,
          tags: post.tags || [],
          seo: post.seo || null,
        };
      }

      // Determine requested format (default: json)
      const requestedFormat = parseFormat(format) || ContentFormat.JSON;
      const storedFormat = latestRevision.contentFormat || ContentFormat.JSON;

      // Convert content format if needed
      let content = latestRevision.content;
      let contentFormat = storedFormat;

      if (requestedFormat !== storedFormat) {
        try {
          // If stored format is not JSON, convert to JSON first
          let jsonContent: string;
          if (storedFormat === ContentFormat.MD) {
            const json = markdownToJson(content);
            jsonContent = JSON.stringify(json);
          } else if (storedFormat === ContentFormat.HTML) {
            // HTML to JSON (store HTML as-is in content field)
            jsonContent = JSON.stringify({ content, metadata: { format: 'html' } });
          } else {
            jsonContent = content; // Already JSON
          }

          // Now convert from JSON to requested format
          content = convertContentFormat(jsonContent, ContentFormat.JSON, requestedFormat);
          contentFormat = requestedFormat;
        } catch (error) {
          this.logger.warn('Error converting content format', error);
          // If conversion fails, return as-is
        }
      }

      let contentHtml: string | null = null;
      if (content != null && content !== '') {
        try {
          contentHtml = convertContentFormat(content, contentFormat, ContentFormat.HTML);
        } catch {
          contentHtml = null;
        }
      }

      return {
        id: post.id,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        content,
        contentFormat,
        content_html: contentHtml,
        language: post.language,
        coverImageUrl: post.coverImageUrl,
        coverImageCreditJson: post.coverImageCreditJson,
        publishedAt: post.publishedAt,
        author: post.author
          ? {
              name: post.author.name,
              email: post.author.email,
            }
          : null,
        tags: post.tags || [],
        seo: post.seo || null,
      };
    } catch (error) {
      this.logger.error('Error getting published post via API', error);
      throw error;
    }
  }

  private async recordUsageEvent(
    organizationId: string,
    projectId: string,
    postId: string | null,
    eventType: UsageEventType,
    metadata?: Record<string, any>,
  ) {
    try {
      const event = this.usageEventsRepository.create({
        organizationId,
        projectId,
        postId,
        eventType,
        metadata: metadata || null,
      });
      await this.usageEventsRepository.save(event);
    } catch (error) {
      this.logger.error('Error recording usage event', error);
    }
  }

  private async triggerWebhook(organizationId: string, projectId: string, event: WebhookEvent, data: any) {
    try {
      const webhooks = await this.webhooksRepository.find({
        where: {
          organizationId,
          projectId,
          active: true,
        },
      });

      for (const webhook of webhooks) {
        // Check if webhook subscribes to this event
        if (!webhook.events || !webhook.events.includes(event)) {
          continue;
        }

        try {
          const payload = {
            event,
            data,
            timestamp: new Date().toISOString(),
          };

          // Create signature if secret exists
          let headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'X-Webhook-Event': event,
          };

          if (webhook.secret) {
            const signature = crypto
              .createHmac('sha256', webhook.secret)
              .update(JSON.stringify(payload))
              .digest('hex');
            headers['X-Webhook-Signature'] = signature;
          }

          // Send webhook (using fetch - you might want to use axios or httpService)
          const response = await fetch(webhook.url, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload),
          });

          if (response.ok) {
            webhook.lastTriggeredAt = new Date();
            webhook.failureCount = 0;
            await this.webhooksRepository.save(webhook);
            this.logger.log(`Webhook triggered successfully: ${webhook.url}`);
          } else {
            webhook.failureCount += 1;
            await this.webhooksRepository.save(webhook);
            this.logger.warn(`Webhook failed: ${webhook.url} - Status: ${response.status}`);
          }
        } catch (error) {
          webhook.failureCount += 1;
          await this.webhooksRepository.save(webhook);
          this.logger.error(`Error triggering webhook: ${webhook.url}`, error);
        }
      }
    } catch (error) {
      this.logger.error('Error in triggerWebhook', error);
    }
  }
}
