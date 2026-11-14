import { HtmlSanitizerService } from '../common/services/html-sanitizer.service';
import { WebhookService } from '../webhooks/webhook.service';
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, MoreThan } from 'typeorm';
import { Post, PostStatus, PostLanguage } from '../entities/post.entity';
import { Organization } from '../entities/organization.entity';
import { Project } from '../entities/project.entity';
import { Workspace } from '../entities/workspace.entity';
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
import {
  convertContentFormat,
  parseFormat,
  markdownToJson,
} from '../common/utils/content-format.util';
import { toSlug, toUniqueSlug } from '../common/utils/slug.util';
import { getPublishedRevision } from '../common/utils/revision.util';
import { decodeCursor, encodeCursor } from '../common/utils/cursor.util';
import * as crypto from 'crypto';

/** Guards the workspace lookup: a non-uuid slug makes Postgres throw, not return empty. */
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
    private readonly webhookService: WebhookService,
    private readonly htmlSanitizer: HtmlSanitizerService,
    @InjectRepository(GenerationJob)
    private generationJobsRepository: Repository<GenerationJob>,
    @InjectRepository(UsageEvent)
    private usageEventsRepository: Repository<UsageEvent>,
    @InjectRepository(IdempotencyKey)
    private idempotencyKeysRepository: Repository<IdempotencyKey>,
    @InjectRepository(Workspace)
    private workspacesRepository: Repository<Workspace>,
    private sqsService: SqsService,
    private postsService: PostsService,
  ) {}

  /**
   * The workspace behind an API project, so a post lands in both tenancy models
   * at once.
   *
   * The two are bridged by convention — `project.slug` holds the workspace id
   * (see `BlogService.getUserOrganizationAndProject`) — but the slug is a plain
   * string, so it is verified against `workspaces` rather than trusted. A
   * project created outside that convention yields null, which is the old
   * behaviour and strictly no worse.
   */
  private async resolveWorkspaceId(project: Project): Promise<string | null> {
    if (!project?.slug || !UUID_PATTERN.test(project.slug)) return null;

    const workspace = await this.workspacesRepository.findOne({
      where: { id: project.slug },
      select: ['id'],
    });
    return workspace?.id ?? null;
  }

  async generate(
    organization: Organization,
    project: Project,
    dto: GenerateApiDto,
    idempotencyKey?: string,
  ) {
    try {
      // Check idempotency if key provided. The row is reserved up-front so a
      // duplicate request cannot do the work twice, and a reused key with a
      // different payload is rejected instead of failing on the unique index later.
      const requestHash = idempotencyKey ? this.hashRequest(dto) : null;
      if (idempotencyKey) {
        const existingKey = await this.idempotencyKeysRepository.findOne({
          where: {
            organizationId: organization.id,
            projectId: project.id,
            key: idempotencyKey,
          },
        });

        if (existingKey) {
          const expired = existingKey.expiresAt <= new Date();

          if (!expired && existingKey.requestHash !== requestHash) {
            throw new ConflictException(
              'This Idempotency-Key was already used with a different request body.',
            );
          }

          if (!expired) {
            this.logger.log(`Idempotency key hit: ${idempotencyKey}`);
            return existingKey.response.body;
          }

          // Expired: free the key so it can be reserved again below.
          await this.idempotencyKeysRepository.delete({ id: existingKey.id });
        }

        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);

        try {
          await this.idempotencyKeysRepository.insert({
            organizationId: organization.id,
            projectId: project.id,
            key: idempotencyKey,
            requestHash: requestHash as string,
            response: { statusCode: 202, body: { status: 'processing' } } as any,
            expiresAt,
          });
        } catch {
          // Lost the race against a concurrent identical request.
          throw new ConflictException(
            'A request with this Idempotency-Key is already in progress.',
          );
        }
      }

      // Generate unique slug from topic (Turkish chars → ASCII, no timestamp suffix)
      const baseSlug = toSlug(dto.topic);
      const slug = await toUniqueSlug(baseSlug, async (candidate) => {
        const existing = await this.postsRepository.findOne({
          where: { organizationId: organization.id, projectId: project.id, slug: candidate },
        });
        return !!existing;
      });

      // Parse cover image credit JSON if provided
      let coverImageCreditJson: { name: string; photographerUrl: string; photoUrl: string } | null =
        null;
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
        slug,
        organizationId: organization.id,
        projectId: project.id,
        // Without this the post is invisible in the dashboard: that surface
        // filters on workspaceId alone, so an API-created post scoped only by
        // organization/project silently never appears for its own owner.
        workspaceId: await this.resolveWorkspaceId(project),
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
      const savedPost = (await this.postsRepository.save(post)) as unknown as Post;

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
        keywords: dto.keywords,
        outline: dto.outline,
        // Always generate canonical JSON; we convert to other formats for clients
        format: ContentFormat.JSON,
      });

      // Record usage event
      await this.recordUsageEvent(
        organization.id,
        project.id,
        savedPost.id,
        UsageEventType.POST_GENERATED,
        {
          model: dto.model || 'gpt-4.1-mini',
        },
      );

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

      // Record the real response against the reserved key so retries replay it.
      if (idempotencyKey) {
        await this.idempotencyKeysRepository.update(
          { organizationId: organization.id, projectId: project.id, key: idempotencyKey },
          { response: { statusCode: 200, body: response } as any },
        );
      }

      return response;
    } catch (error) {
      // Release the reservation on failure so the caller can retry the same key.
      if (idempotencyKey && !(error instanceof ConflictException)) {
        await this.idempotencyKeysRepository
          .delete({ organizationId: organization.id, projectId: project.id, key: idempotencyKey })
          .catch(() => undefined);
      }
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
        response.progress = job.processingTimeMs
          ? Math.min(100, (job.processingTimeMs / 60000) * 100)
          : null;
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

  /**
   * Delete a post through the partner API.
   *
   * Scoped by organization + project — the same predicate every other API read
   * uses — so an API key can only ever delete its own project's posts, and a
   * foreign id is indistinguishable from a missing one (404, not 403: revealing
   * that a post exists in someone else's project is itself a leak).
   */
  async deletePost(organization: Organization, project: Project, postId: string) {
    const post = await this.postsRepository.findOne({
      where: { id: postId, organizationId: organization.id, projectId: project.id },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    await this.postsService.hardDelete(post);
    this.logger.log(`API deleted post ${postId} (org ${organization.id}, project ${project.id})`);

    return { id: postId, deleted: true };
  }

  async updatePost(
    organization: Organization,
    project: Project,
    postId: string,
    dto: UpdatePostApiDto,
  ) {
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
      const pageSize = this.clampLimit(limit);

      const queryBuilder = this.postsRepository
        .createQueryBuilder('post')
        .leftJoinAndSelect('post.author', 'author')
        .leftJoinAndSelect('post.tags', 'tags')
        .where('post.organizationId = :organizationId', { organizationId: organization.id })
        .andWhere('post.projectId = :projectId', { projectId: project.id })
        .orderBy('post.createdAt', 'DESC')
        .addOrderBy('post.id', 'DESC')
        .take(pageSize + 1); // Fetch one extra to detect a next page

      if (status) {
        queryBuilder.andWhere('post.status = :status', { status });
      }

      if (cursor) {
        const decoded = decodeCursor(cursor);
        if (!decoded) {
          throw new BadRequestException('Invalid cursor');
        }
        // (createdAt, id) composite keeps rows that share a timestamp from being skipped.
        queryBuilder.andWhere(
          '(post.createdAt < :cursorTimestamp OR (post.createdAt = :cursorTimestamp AND post.id < :cursorId))',
          { cursorTimestamp: new Date(decoded.timestamp), cursorId: decoded.id },
        );
      }

      const posts = await queryBuilder.getMany();
      const hasMore = posts.length > pageSize;
      const resultPosts = hasMore ? posts.slice(0, pageSize) : posts;

      const lastPost = resultPosts[resultPosts.length - 1];
      const nextCursor = hasMore && lastPost ? encodeCursor(lastPost.createdAt, lastPost.id) : null;

      return {
        posts: resultPosts.map((post) => ({
          id: post.id,
          title: this.plainText(post.title),
          slug: post.slug,
          excerpt: this.plainText(post.excerpt),
          status: post.status,
          language: post.language,
          coverImageUrl: post.coverImageUrl,
          publishedAt: post.publishedAt,
          createdAt: post.createdAt,
          updatedAt: post.updatedAt,
          author: post.author ? { name: post.author.name } : null,
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

  /** Page size is clamped so `hasMore`/cursor accounting can never disagree with the query. */
  private clampLimit(limit: number, max = 100): number {
    if (!Number.isFinite(limit) || limit < 1) return 50;
    return Math.min(Math.floor(limit), max);
  }

  async getPublicPostsByProjectSlug(projectSlug: string, limit: number = 50, cursor?: string) {
    try {
      const project = await this.resolvePublicProject(projectSlug);
      const pageSize = this.clampLimit(limit);

      const queryBuilder = this.postsRepository
        .createQueryBuilder('post')
        .leftJoinAndSelect('post.author', 'author')
        .leftJoinAndSelect('post.tags', 'tags')
        .where('post.organizationId = :organizationId', { organizationId: project.organizationId })
        .andWhere('post.projectId = :projectId', { projectId: project.id })
        .andWhere('post.status = :status', { status: PostStatus.PUBLISHED })
        .orderBy('post.publishedAt', 'DESC')
        .addOrderBy('post.id', 'DESC')
        .take(pageSize + 1);

      if (cursor) {
        const decoded = decodeCursor(cursor);
        if (!decoded) {
          throw new BadRequestException('Invalid cursor');
        }
        queryBuilder.andWhere(
          '(post.publishedAt < :cursorTimestamp OR (post.publishedAt = :cursorTimestamp AND post.id < :cursorId))',
          { cursorTimestamp: new Date(decoded.timestamp), cursorId: decoded.id },
        );
      }

      const posts = await queryBuilder.getMany();
      const hasMore = posts.length > pageSize;
      const resultPosts = hasMore ? posts.slice(0, pageSize) : posts;

      const lastPost = resultPosts[resultPosts.length - 1];
      const nextCursor =
        hasMore && lastPost?.publishedAt ? encodeCursor(lastPost.publishedAt, lastPost.id) : null;

      return {
        posts: resultPosts.map((post) => ({
          id: post.id,
          title: this.plainText(post.title),
          slug: post.slug,
          excerpt: this.plainText(post.excerpt),
          language: post.language,
          coverImageUrl: post.coverImageUrl,
          publishedAt: post.publishedAt,
          // Public surface: never expose the author's account email.
          author: post.author ? { name: post.author.name } : null,
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

  /**
   * Project slugs are unique per organization, not globally. Resolve strictly and
   * refuse ambiguous slugs rather than serving an arbitrary organization's content.
   */
  private async resolvePublicProject(projectSlug: string): Promise<Project> {
    const projects = await this.projectsRepository.find({
      where: { slug: projectSlug, active: true },
      take: 2,
    });

    if (projects.length === 0) {
      throw new NotFoundException('Project not found');
    }
    if (projects.length > 1) {
      this.logger.error(`Ambiguous public project slug: ${projectSlug}`);
      throw new NotFoundException('Project not found');
    }

    return projects[0];
  }

  async getPublicPostByProjectSlug(projectSlug: string, slug: string, format?: string) {
    try {
      const project = await this.resolvePublicProject(projectSlug);

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

      const latestRevision = getPublishedRevision(post);

      if (!latestRevision || !latestRevision.content) {
        return {
          id: post.id,
          title: this.plainText(post.title),
          slug: post.slug,
          excerpt: this.plainText(post.excerpt),
          content: null,
          contentFormat: format || 'json',
          content_html: null,
          language: post.language,
          coverImageUrl: post.coverImageUrl,
          coverImageCreditJson: post.coverImageCreditJson,
          publishedAt: post.publishedAt,
          author: post.author ? { name: post.author.name } : null,
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
          contentHtml = this.htmlSanitizer.sanitize(
            convertContentFormat(content, contentFormat, ContentFormat.HTML),
            true,
          );
        } catch {
          contentHtml = null;
        }
      }

      return {
        id: post.id,
        title: this.plainText(post.title),
        slug: post.slug,
        excerpt: this.plainText(post.excerpt),
        content,
        contentFormat,
        content_html: contentHtml,
        language: post.language,
        coverImageUrl: post.coverImageUrl,
        coverImageCreditJson: post.coverImageCreditJson,
        publishedAt: post.publishedAt,
        author: post.author ? { name: post.author.name } : null,
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
      if (!dto.postId) {
        throw new BadRequestException('postId is required');
      }

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
      await this.recordUsageEvent(
        organization.id,
        project.id,
        savedPost.id,
        UsageEventType.POST_PUBLISHED,
      );

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

  async listPosts(
    organization: Organization,
    project: Project,
    status?: PostStatus,
    limit: number = 50,
  ) {
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
        title: this.plainText(post.title),
        slug: post.slug,
        excerpt: this.plainText(post.excerpt),
        status: post.status,
        language: post.language,
        coverImageUrl: post.coverImageUrl,
        publishedAt: post.publishedAt,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        author: post.author ? { name: post.author.name } : null,
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
      const latestRevision = getPublishedRevision(post);

      if (!latestRevision || !latestRevision.content) {
        return {
          id: post.id,
          title: this.plainText(post.title),
          slug: post.slug,
          excerpt: this.plainText(post.excerpt),
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
          author: post.author ? { name: post.author.name } : null,
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
          contentHtml = this.htmlSanitizer.sanitize(
            convertContentFormat(content, contentFormat, ContentFormat.HTML),
            true,
          );
        } catch {
          contentHtml = null;
        }
      }

      return {
        id: post.id,
        title: this.plainText(post.title),
        slug: post.slug,
        excerpt: this.plainText(post.excerpt),
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
        author: post.author ? { name: post.author.name } : null,
        tags: post.tags || [],
        seo: post.seo || null,
      };
    } catch (error) {
      this.logger.error('Error getting post via API', error);
      throw error;
    }
  }

  async getPublishedPosts(
    organization: Organization,
    project: Project,
    limit: number = 50,
    cursor?: string,
  ) {
    try {
      const pageSize = this.clampLimit(limit);

      const queryBuilder = this.postsRepository
        .createQueryBuilder('post')
        .leftJoinAndSelect('post.author', 'author')
        .leftJoinAndSelect('post.tags', 'tags')
        .where('post.organizationId = :organizationId', { organizationId: organization.id })
        .andWhere('post.projectId = :projectId', { projectId: project.id })
        .andWhere('post.status = :status', { status: PostStatus.PUBLISHED })
        .orderBy('post.publishedAt', 'DESC')
        .addOrderBy('post.id', 'DESC')
        .take(pageSize + 1);

      if (cursor) {
        const decoded = decodeCursor(cursor);
        if (!decoded) {
          throw new BadRequestException('Invalid cursor');
        }
        queryBuilder.andWhere(
          '(post.publishedAt < :cursorTimestamp OR (post.publishedAt = :cursorTimestamp AND post.id < :cursorId))',
          { cursorTimestamp: new Date(decoded.timestamp), cursorId: decoded.id },
        );
      }

      const posts = await queryBuilder.getMany();
      const hasMore = posts.length > pageSize;
      const resultPosts = hasMore ? posts.slice(0, pageSize) : posts;

      const lastPost = resultPosts[resultPosts.length - 1];
      const nextCursor =
        hasMore && lastPost?.publishedAt ? encodeCursor(lastPost.publishedAt, lastPost.id) : null;

      return {
        posts: resultPosts.map((post) => ({
          id: post.id,
          title: this.plainText(post.title),
          slug: post.slug,
          excerpt: this.plainText(post.excerpt),
          language: post.language,
          coverImageUrl: post.coverImageUrl,
          publishedAt: post.publishedAt,
          author: post.author ? { name: post.author.name } : null,
          tags: post.tags || [],
        })),
        cursor: nextCursor,
        hasMore,
      };
    } catch (error) {
      this.logger.error('Error getting published posts via API', error);
      throw error;
    }
  }

  async getPublishedPost(
    organization: Organization,
    project: Project,
    slug: string,
    format?: string,
  ) {
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
      const latestRevision = getPublishedRevision(post);

      if (!latestRevision || !latestRevision.content) {
        return {
          id: post.id,
          title: this.plainText(post.title),
          slug: post.slug,
          excerpt: this.plainText(post.excerpt),
          content: null,
          contentFormat: format || 'json',
          content_html: null,
          language: post.language,
          coverImageUrl: post.coverImageUrl,
          coverImageCreditJson: post.coverImageCreditJson,
          publishedAt: post.publishedAt,
          author: post.author ? { name: post.author.name } : null,
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
          contentHtml = this.htmlSanitizer.sanitize(
            convertContentFormat(content, contentFormat, ContentFormat.HTML),
            true,
          );
        } catch {
          contentHtml = null;
        }
      }

      return {
        id: post.id,
        title: this.plainText(post.title),
        slug: post.slug,
        excerpt: this.plainText(post.excerpt),
        content,
        contentFormat,
        content_html: contentHtml,
        language: post.language,
        coverImageUrl: post.coverImageUrl,
        coverImageCreditJson: post.coverImageCreditJson,
        publishedAt: post.publishedAt,
        author: post.author ? { name: post.author.name } : null,
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

  /**
   * Text fields leave as text.
   *
   * `title` and `excerpt` are model-written and were emitted raw while
   * `content_html` beside them was sanitized — and a receiver puts them
   * straight into a page (the documented WordPress one maps them to
   * `post_title` and `post_excerpt`). The schema already calls for plain text
   * here; this is what enforces it.
   *
   * Null and undefined pass through unchanged: turning a missing field into an
   * empty string would be a silent API change.
   */
  private plainText(value: string | null | undefined): string | null | undefined {
    if (value === null || value === undefined) return value;
    return this.htmlSanitizer.stripHtml(value);
  }

  /**
   * Webhook delivery, delegated.
   *
   * This used to be a second implementation that called `fetch` directly, and
   * it drifted: `WebhookService` re-validated the URL and pinned the resolved
   * address at connect time, this one did neither. Two delivery paths meant two
   * places to get SSRF right, and only one of them was.
   *
   * Failures stay swallowed — a customer's broken endpoint must not fail the
   * generation they paid for. `WebhookService` already settles each delivery
   * individually; this guards the repository read around them.
   */
  private async triggerWebhook(
    organizationId: string,
    projectId: string,
    event: WebhookEvent,
    data: any,
  ) {
    try {
      await this.webhookService.triggerWebhook(organizationId, projectId, event, data);
    } catch (error) {
      this.logger.error('Error in triggerWebhook', error);
    }
  }
}
