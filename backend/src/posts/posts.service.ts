import { Injectable, NotFoundException, ForbiddenException, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, LessThanOrEqual } from 'typeorm';
import { Post, PostStatus, PostLanguage } from '../entities/post.entity';
import { Workspace } from '../entities/workspace.entity';
import { Tag } from '../entities/tag.entity';
import { User, UserRole } from '../entities/user.entity';
import { PostRevision, ContentFormat, ContentEditor } from '../entities/post-revision.entity';
import { GenerationJob, JobStatus } from '../entities/generation-job.entity';
import { Organization } from '../entities/organization.entity';
import { Project } from '../entities/project.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { GeneratePostDto } from './dto/generate-post.dto';
import { SqsService } from '../queue/sqs.service';
import { WebhookService } from '../webhooks/webhook.service';
import { BillingService } from '../billing/billing.service';
import { WebhookEvent } from '../entities/webhook.entity';
import { markdownToHtml, calculateReadingTime } from '../common/utils/markdown-to-html.util';
import { toSlug, toUniqueSlug } from '../common/utils/slug.util';
import { getLatestRevision, getPublishedRevision, sortRevisionsDesc } from '../common/utils/revision.util';
import { HtmlSanitizerService } from '../common/services/html-sanitizer.service';

@Injectable()
export class PostsService {
  private readonly logger = new Logger(PostsService.name);

  constructor(
    @InjectRepository(Post)
    private postsRepository: Repository<Post>,
    @InjectRepository(Workspace)
    private workspacesRepository: Repository<Workspace>,
    @InjectRepository(Tag)
    private tagsRepository: Repository<Tag>,
    @InjectRepository(PostRevision)
    private postRevisionsRepository: Repository<PostRevision>,
    @InjectRepository(GenerationJob)
    private generationJobRepository: Repository<GenerationJob>,
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
    private sqsService: SqsService,
    private webhookService: WebhookService,
    private billingService: BillingService,
    private htmlSanitizer: HtmlSanitizerService,
  ) {}

  async create(user: User, createPostDto: CreatePostDto) {
    const workspace = await this.workspacesRepository.findOne({
      where: { id: createPostDto.workspaceId },
      relations: ['owner'],
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    if (workspace.ownerId !== user.id) {
      throw new ForbiddenException('Access denied');
    }

    // Extract tags from DTO (they will be handled separately)
    const { tags: tagNames, coverImageCreditJson: coverImageCreditJsonStr, ...postData } = createPostDto;

    // Parse cover image credit JSON if provided
    let coverImageCreditJson: { name: string; photographerUrl: string; photoUrl: string } | null = null;
    if (coverImageCreditJsonStr) {
      try {
        coverImageCreditJson = typeof coverImageCreditJsonStr === 'string' 
          ? JSON.parse(coverImageCreditJsonStr) 
          : coverImageCreditJsonStr;
      } catch (e) {
        // Invalid JSON, ignore
      }
    }

    const post = this.postsRepository.create({
      ...postData,
      status: createPostDto.status || PostStatus.DRAFT,
      workspaceId: createPostDto.workspaceId,
      authorId: createPostDto.authorId || user.id,
      coverImageCreditJson: coverImageCreditJson,
    });

    if (createPostDto.status === PostStatus.PUBLISHED) {
      // Gizlenmiş blog'lar yayınlanamaz (create sırasında olmaz ama kontrol ekleyelim)
      if (post.hiddenByAdmin) {
        throw new ForbiddenException('Admin tarafından gizlenmiş blog\'lar yayınlanamaz.');
      }
      post.publishedAt = new Date();
    }

    if (createPostDto.status === PostStatus.SCHEDULED && createPostDto.scheduledAt) {
      post.scheduledAt = createPostDto.scheduledAt;
    }

    const savedPost = await this.postsRepository.save(post);

    // Handle tags if provided
    if (tagNames && tagNames.length > 0) {
      await this.attachTags(savedPost.id, tagNames, workspace.id);
      // Reload post with tags
      return this.postsRepository.findOne({
        where: { id: savedPost.id },
        relations: ['tags', 'workspace', 'author'],
      });
    }

    return savedPost;
  }

  private async attachTags(postId: string, tagNames: string[], workspaceId: string) {
    const post = await this.postsRepository.findOne({
      where: { id: postId },
      relations: ['tags'],
    });

    if (!post) {
      return;
    }

    const tags: Tag[] = [];

    for (const tagName of tagNames) {
      // Create slug from tag name
      const slug = tagName
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      // Find or create tag
      let tag = await this.tagsRepository.findOne({
        where: { workspaceId, slug },
      });

      if (!tag) {
        tag = this.tagsRepository.create({
          name: tagName,
          slug,
          workspaceId,
        });
        tag = await this.tagsRepository.save(tag);
      }

      tags.push(tag);
    }

    post.tags = tags;
    await this.postsRepository.save(post);
  }

  async findPublic(
    limit: number = 10,
    postIds?: string[],
    organizationId?: string,
    projectId?: string,
    slug?: string,
  ) {
    const where: any = {
      hiddenByAdmin: false,
    };

    // Eğer postIds verilmişse (homepage posts), published olmasa bile getir
    // Aksi halde sadece published blogları getir
    if (!postIds || postIds.length === 0) {
      where.status = PostStatus.PUBLISHED;
    }

    if (organizationId) {
      where.organizationId = organizationId;
    }
    if (projectId) {
      where.projectId = projectId;
    }
    if (slug) {
      where.slug = slug;
    }

    let posts: Post[];
    
    if (postIds && postIds.length > 0) {
      // Belirli post ID'leri ile getir (homepage posts - published olmasa bile)
      posts = await this.postsRepository.find({
        where: {
          ...where,
          id: In(postIds),
        },
        relations: ['author', 'tags'],
      });
      
      // Sırayı koru (homepage posts sırasına göre); id tip uyumu için String kullan
      posts = postIds
        .map(id => posts.find(p => String(p.id) === String(id)))
        .filter(Boolean) as Post[];
    } else if (slug) {
      // Slug ile tek post getir
      posts = await this.postsRepository.find({
        where,
        relations: ['author', 'tags', 'revisions'],
        take: 1,
      });
    } else {
      // Normal akış: limit ile getir
      posts = await this.postsRepository.find({
        where,
        relations: ['author', 'tags'],
        order: { publishedAt: 'DESC' },
        take: limit,
      });
    }
    
    // Return only necessary fields for public display
    return posts.map((post) => {
      // Get latest revision content if slug query (single post)
      let contentMarkdown: string | undefined;
      let contentHtml: string | undefined;
      let readingTime: number | undefined;

      if (slug && post.revisions && post.revisions.length > 0) {
        const activeRevision = getPublishedRevision(post);
        if (activeRevision) {
        const raw = activeRevision.content || '';

        if (activeRevision.contentFormat === ContentFormat.JSON && raw) {
          // Canonical JSON → markdown (desteklenen eski/yeni şemaları birleştir)
          let markdown = '';
          try {
            const parsed: any = JSON.parse(raw);
            if (parsed && typeof parsed === 'object') {
              const parts: string[] = [];

              if (typeof parsed.title === 'string' && parsed.title.trim()) {
                parts.push(`# ${parsed.title.trim()}`);
              }

              if (typeof parsed.intro === 'string' && parsed.intro.trim()) {
                parts.push(parsed.intro.trim());
              }

              if (typeof parsed.body === 'string' && parsed.body.trim()) {
                parts.push(parsed.body.trim());
              }

              if (typeof parsed.content === 'string' && parsed.content.trim()) {
                parts.push(parsed.content.trim());
              }

              if (Array.isArray(parsed.sections)) {
                parsed.sections.forEach((section: any) => {
                  if (!section || typeof section !== 'object') return;
                  const heading = (section.title || section.heading) as string | undefined;
                  const sectionBlocks: string[] = [];

                  if (heading && typeof heading === 'string') {
                    sectionBlocks.push(`## ${heading.trim()}`);
                  }

                  if (typeof section.content === 'string' && section.content.trim()) {
                    sectionBlocks.push(section.content.trim());
                  } else if (Array.isArray(section.content)) {
                    section.content.forEach((c: any) => {
                      if (typeof c === 'string' && c.trim()) {
                        sectionBlocks.push(c.trim());
                      }
                    });
                  }

                  if (typeof section.body === 'string' && section.body.trim()) {
                    sectionBlocks.push(section.body.trim());
                  }

                  if (Array.isArray(section.paragraphs)) {
                    section.paragraphs.forEach((para: any) => {
                      if (typeof para === 'string' && para.trim()) {
                        sectionBlocks.push(para.trim());
                      }
                    });
                  }

                  // Yeni canonical şema: subsections[]
                  if (Array.isArray(section.subsections)) {
                    sectionBlocks.push(''); // boş satır ayırıcı
                    sectionBlocks.push(''); // görsel nefes payı
                    sectionBlocks.push(''); // ekstra ayrım
                    section.subsections.forEach((sub: any) => {
                      if (!sub || typeof sub !== 'object') return;
                      const subHeading = (sub.title || sub.heading) as string | undefined;
                      if (subHeading && typeof subHeading === 'string') {
                        sectionBlocks.push(`### ${subHeading.trim()}`);
                      }
                      if (typeof sub.content === 'string' && sub.content.trim()) {
                        sectionBlocks.push(sub.content.trim());
                      }
                      if (Array.isArray(sub.paragraphs)) {
                        sub.paragraphs.forEach((para: any) => {
                          if (typeof para === 'string' && para.trim()) {
                            sectionBlocks.push(para.trim());
                          }
                        });
                      }
                    });
                  }

                  if (sectionBlocks.length) {
                    parts.push(sectionBlocks.join('\n\n'));
                  }
                });
              }

              markdown = parts.join('\n\n').trim();
            }
          } catch {
            // JSON parse hatasında raw JSON'u content olarak gönderme
          }

          contentMarkdown = markdown && markdown.trim() ? markdown : undefined;
        } else if (activeRevision.contentFormat === ContentFormat.MD) {
          contentMarkdown = raw;
        } else if (activeRevision.contentFormat === ContentFormat.HTML) {
          // HTML olarak saklanmışsa direkt HTML kullan, markdown'ı sadeleştirmek isteğe bağlı
          contentHtml = this.htmlSanitizer.sanitize(raw, true);
          contentMarkdown = undefined;
        } else {
          // Bilinmeyen formatlar için ham içeriği markdown gibi işle
          contentMarkdown = raw;
        }

        if (contentMarkdown) {
          // Sanitize markdown if it contains HTML
          if (this.htmlSanitizer.isDangerous(contentMarkdown)) {
            contentMarkdown = this.htmlSanitizer.sanitize(contentMarkdown, true);
          }

          // Convert to HTML and sanitize
          contentHtml = this.htmlSanitizer.sanitize(markdownToHtml(contentMarkdown), true);
          readingTime = calculateReadingTime(contentMarkdown);
        }
        }
      }

      const basePost = {
        id: post.id,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        coverImageUrl: post.coverImageUrl,
        canonicalUrl: post.canonicalUrl || null,
        publishedAt: post.publishedAt,
        language: post.language,
        author: post.author
          ? {
              name: post.author.name,
              email: post.author.email,
            }
          : null,
        tags: post.tags?.map((tag) => ({
          id: tag.id,
          name: tag.name,
          slug: tag.slug,
        })) || [],
      };

      // Add content fields if single post (slug query) — markdown veya HTML varsa dön
      if (slug && (contentMarkdown || contentHtml)) {
        return {
          ...basePost,
          ...(contentMarkdown && { content_markdown: contentMarkdown }),
          ...(contentHtml && { content_html: contentHtml }),
          ...(contentMarkdown && { reading_time: readingTime }),
        };
      }

      return basePost;
    });
  }

  async findAll(user: User, workspaceId?: string, status?: PostStatus) {
    const queryBuilder = this.postsRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.workspace', 'workspace')
      .leftJoinAndSelect('post.author', 'author')
      .leftJoinAndSelect('post.tags', 'tags');

    // Tüm kullanıcılar (admin dahil) dashboard'da sadece kendi bloglarını görebilir
    // Admin paneli için ayrı endpoint kullanılmalı (/admin/posts)
    if (workspaceId) {
      const workspace = await this.workspacesRepository.findOne({
        where: { id: workspaceId },
        relations: ['owner'],
      });
      if (!workspace || workspace.ownerId !== user.id) {
        throw new ForbiddenException('Access denied');
      }
      queryBuilder.where('post.workspaceId = :workspaceId', { workspaceId });
    } else {
      // User'ın workspace'lerini bul
      const workspaces = await this.workspacesRepository.find({
        where: { ownerId: user.id },
      });
      if (workspaces.length === 0) {
        // User'ın workspace'i yoksa boş array dön
        return [];
      }
      const workspaceIds = workspaces.map((w) => w.id);
      queryBuilder.where('post.workspaceId IN (:...workspaceIds)', { workspaceIds });
    }

    if (status) {
      queryBuilder.andWhere('post.status = :status', { status });
    }

    queryBuilder.orderBy('post.createdAt', 'DESC');

    return queryBuilder.getMany();
  }

  async generate(user: User, generatePostDto: GeneratePostDto) {
    const workspace = await this.workspacesRepository.findOne({
      where: { id: generatePostDto.workspaceId },
      relations: ['owner'],
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    if (workspace.ownerId !== user.id) {
      throw new ForbiddenException('Access denied');
    }

    // Plan, tier permission and token balance are all checked here so the caller
    // gets an actionable error immediately instead of a job that fails in the worker.
    const tier = await this.billingService.authorizeGeneration(user.id, generatePostDto.model);

    // Generate unique slug from topic (Turkish chars → ASCII, no timestamp suffix)
    const baseSlug = toSlug(generatePostDto.topic);
    const slug = await toUniqueSlug(baseSlug, async (candidate) => {
      const existing = await this.postsRepository.findOne({ where: { slug: candidate } });
      return !!existing;
    });

    // Parse cover image credit JSON if provided
    let coverImageCreditJson: { name: string; photographerUrl: string; photoUrl: string } | null = null;
    if (generatePostDto.coverImageCreditJson) {
      try {
        coverImageCreditJson = JSON.parse(generatePostDto.coverImageCreditJson);
      } catch (e) {
        // Invalid JSON, ignore
      }
    }

    // Create post with queued status
    const postData: any = {
      title: generatePostDto.topic,
      slug,
      workspaceId: generatePostDto.workspaceId,
      authorId: user.id,
      language: generatePostDto.language || PostLanguage.TR,
      status: PostStatus.QUEUED,
    };

    if (generatePostDto.coverImageUrl) {
      postData.coverImageUrl = generatePostDto.coverImageUrl;
    }
    if (coverImageCreditJson) {
      postData.coverImageCreditJson = coverImageCreditJson;
    }

    // Get or create organization and project FIRST (before creating post)
    // ✅ Use workspace-specific organization name to match API key creation logic
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

    // Get or create project for workspace
    // ✅ Use workspace.id as project slug to match with API key creation logic
    const projectSlug = generatePostDto.workspaceId; // workspace.id
    let project = await this.projectRepository.findOne({
      where: { organizationId: organization.id, slug: projectSlug },
    });

    if (!project) {
      project = this.projectRepository.create({
        organizationId: organization.id,
        name: workspace.name,
        slug: projectSlug, // Use workspace.id as slug to match with API keys
        description: workspace.description || `Project for workspace: ${workspace.name}`,
        active: true,
      });
      project = await this.projectRepository.save(project);
    }

    // ✅ Set organizationId and projectId when creating post
    postData.organizationId = organization.id;
    postData.projectId = project.id;

    const post = this.postsRepository.create(postData);
    const savedPost = (await this.postsRepository.save(post)) as unknown as Post;

    // Create generation job
    const job = this.generationJobRepository.create({
      organizationId: organization.id,
      projectId: project.id,
      postId: savedPost.id,
      status: JobStatus.PENDING,
      requestData: {
        topic: generatePostDto.topic,
        language: generatePostDto.language || PostLanguage.TR,
        tone: generatePostDto.tone,
        length: generatePostDto.length,
        seoMode: generatePostDto.seoMode,
        model: tier,
        additionalContext: generatePostDto.additionalContext,
        targetAudience: generatePostDto.targetAudience,
      },
    });
    const savedJob = await this.generationJobRepository.save(job);

    // Send message to SQS with jobId
    const languageValue = generatePostDto.language 
      ? (typeof generatePostDto.language === 'string' 
          ? generatePostDto.language 
          : (generatePostDto.language as PostLanguage))
      : PostLanguage.TR;
    
    await this.sqsService.sendGeneratePostMessage({
      jobId: savedJob.id, // Include jobId for idempotency
      postId: savedPost.id,
      workspaceId: generatePostDto.workspaceId,
      language: languageValue as string,
      topic: generatePostDto.topic,
      tone: generatePostDto.tone || 'professional',
      length: generatePostDto.length || 'medium',
      seoMode: generatePostDto.seoMode || false,
      model: tier,
      additionalContext: generatePostDto.additionalContext,
      targetAudience: generatePostDto.targetAudience,
      // Always generate canonical JSON; we convert to other formats later
      format: 'json',
      targetId: generatePostDto.targetId,
    });

    return {
      jobId: savedJob.id,
      postId: savedPost.id,
      status: savedPost.status,
    };
  }

  async findOne(id: string, user: User) {
    const post = await this.postsRepository.findOne({
      where: { id },
      relations: ['workspace', 'workspace.owner', 'tags', 'author', 'revisions'],
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Dashboard için: Tüm kullanıcılar (admin dahil) sadece kendi bloglarını görebilir
    // Admin paneli için ayrı endpoint kullanılmalı (/admin/posts/:id)
    if (post.workspace && post.workspace.ownerId !== user.id) {
      throw new ForbiddenException('Access denied');
    }

    if (post.revisions?.length) {
      post.revisions = sortRevisionsDesc(post.revisions);
    }

    return post;
  }

  async update(id: string, user: User, updatePostDto: UpdatePostDto) {
    const post = await this.postsRepository.findOne({
      where: { id },
      relations: ['workspace', 'workspace.owner', 'tags', 'author', 'revisions'],
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Dashboard için: Tüm kullanıcılar (admin dahil) sadece kendi bloglarını güncelleyebilir
    // Admin paneli için ayrı endpoint kullanılmalı (/admin/posts/:id)
    if (post.workspace && post.workspace.ownerId !== user.id) {
      throw new ForbiddenException('Access denied');
    }
    
    // Extract tags from DTO if present
    const { tags: tagNames, coverImageCreditJson: coverImageCreditJsonStr, ...updateData } = updatePostDto as any;

    // Parse cover image credit JSON if provided
    let coverImageCreditJson: { name: string; photographerUrl: string; photoUrl: string } | null = null;
    if (coverImageCreditJsonStr) {
      try {
        coverImageCreditJson = typeof coverImageCreditJsonStr === 'string' 
          ? JSON.parse(coverImageCreditJsonStr) 
          : coverImageCreditJsonStr;
      } catch (e) {
        // Invalid JSON, ignore
      }
    }

    if (updatePostDto.status === PostStatus.PUBLISHED && post.status !== PostStatus.PUBLISHED) {
      // Gizlenmiş blog'lar yayınlanamaz
      if (post.hiddenByAdmin) {
        throw new ForbiddenException('Admin tarafından gizlenmiş blog\'lar yayınlanamaz. Lütfen admin ile iletişime geçin.');
      }
      post.publishedAt = new Date();
    }

    if (updatePostDto.status === PostStatus.SCHEDULED && updatePostDto.scheduledAt) {
      post.scheduledAt = updatePostDto.scheduledAt;
    }

    // Update post fields (excluding tags)
    Object.assign(post, updateData);
    
    // Set cover image credit JSON if provided
    if (coverImageCreditJson !== null) {
      post.coverImageCreditJson = coverImageCreditJson;
    }

    const savedPost = await this.postsRepository.save(post);

    // If content is provided in updateData, create a new revision
    if ((updatePostDto as any).content) {
      // Get all revisions to find the highest version number
      const allRevisions = await this.postRevisionsRepository.find({
        where: { postId: savedPost.id },
        order: { version: 'DESC' },
      });

      // Check if content actually changed
      const latestRevision = allRevisions[0];
      const contentChanged = !latestRevision || latestRevision.content !== (updatePostDto as any).content;

      if (contentChanged) {
        const newVersion = latestRevision ? latestRevision.version + 1 : 1;

        const newRevision = this.postRevisionsRepository.create({
          postId: savedPost.id,
          version: newVersion,
          content: (updatePostDto as any).content,
          contentFormat: (updatePostDto as any).contentFormat || ContentFormat.MD,
          editor: ContentEditor.HUMAN,
        });

        const savedRevision = await this.postRevisionsRepository.save(newRevision);

        // Published posts should serve the newly saved revision
        if (savedPost.status === PostStatus.PUBLISHED) {
          savedPost.publishedRevisionId = savedRevision.id;
          await this.postsRepository.save(savedPost);
        }
      }
    }

    // Handle tags if provided
    if (tagNames !== undefined && post.workspaceId) {
      await this.attachTags(savedPost.id, tagNames, post.workspaceId);
      // Reload post with tags and revisions
      return this.postsRepository.findOne({
        where: { id: savedPost.id },
        relations: ['tags', 'workspace', 'author', 'revisions'],
      });
    }

    // Reload post with revisions
    const reloaded = await this.postsRepository.findOne({
      where: { id: savedPost.id },
      relations: ['revisions'],
    });
    if (reloaded?.revisions?.length) {
      reloaded.revisions = sortRevisionsDesc(reloaded.revisions);
    }
    return reloaded;
  }

  async remove(id: string, user: User) {
    const post = await this.postsRepository.findOne({
      where: { id },
      relations: ['workspace', 'workspace.owner'],
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Dashboard için: Tüm kullanıcılar (admin dahil) sadece kendi bloglarını silebilir
    // Admin paneli için ayrı endpoint kullanılmalı (/admin/posts/:id)
    if (post.workspace && post.workspace.ownerId !== user.id) {
      throw new ForbiddenException('Access denied');
    }

    await this.deleteWithRelations(post);
    return { message: 'Post deleted successfully' };
  }

  /**
   * Delete any post, skipping the ownership check. Admin-only — the caller is
   * responsible for having verified the ADMIN role.
   *
   * Kept here rather than reimplemented in AdminService so there is a single
   * description of what "deleting a post" means: a second copy would drift, and
   * the failure mode is orphaned generation_jobs / post_tags rows that block the
   * delete with a foreign-key error.
   */
  async removeAsAdmin(id: string): Promise<{ message: string }> {
    const post = await this.postsRepository.findOne({
      where: { id },
      relations: ['workspace', 'workspace.owner'],
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    await this.deleteWithRelations(post);

    this.logger.warn(
      `Admin deleted post ${id} ("${post.title}") owned by workspace ${post.workspaceId ?? 'none'}`,
    );
    return { message: 'Post deleted successfully' };
  }

  /**
   * Remove a post and everything that points at it.
   *
   * `generation_jobs` and `post_tags` have no cascade, so they must go first or
   * the delete fails on a foreign-key violation; revisions, seo and postAssets
   * are handled by CASCADE. All of it in one transaction so a partial failure
   * cannot leave a post with half its relations gone.
   */
  private async deleteWithRelations(post: Post): Promise<void> {
    await this.postsRepository.manager.transaction(async (manager) => {
      await manager
        .createQueryBuilder()
        .delete()
        .from('generation_jobs')
        .where('"post_id" = :postId', { postId: post.id })
        .execute();

      await manager
        .createQueryBuilder()
        .delete()
        .from('post_tags')
        .where('"post_id" = :postId', { postId: post.id })
        .execute();

      await manager.remove(Post, post);
    });
  }

  /**
   * Publish a post
   * Changes status to PUBLISHED and triggers webhook
   */
  async publish(id: string, user: User, revisionId?: string) {
    const post = await this.postsRepository.findOne({
      where: { id },
      relations: ['workspace', 'workspace.owner', 'author', 'organization', 'project', 'revisions'],
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Check access
    if (post.workspace && post.workspace.ownerId !== user.id) {
      throw new ForbiddenException('Access denied');
    }

    const publishableStatuses = [PostStatus.DRAFT, PostStatus.GENERATED, PostStatus.SCHEDULED, PostStatus.PUBLISHED];
    if (!publishableStatuses.includes(post.status)) {
      throw new ForbiddenException(`Cannot publish post with status: ${post.status}`);
    }

    const activeRevisionId = await this.resolvePublishedRevisionId(post, revisionId);
    if (!activeRevisionId) {
      throw new BadRequestException('No revision available to publish');
    }

    post.publishedRevisionId = activeRevisionId;

    if (post.status !== PostStatus.PUBLISHED) {
      post.status = PostStatus.PUBLISHED;
      post.publishedAt = new Date();
    }

    post.scheduledAt = null;
    const savedPost = await this.postsRepository.save(post);

    // Trigger webhook if organization and project exist
    if (post.organizationId && post.projectId) {
      await this.webhookService.triggerWebhook(
        post.organizationId,
        post.projectId,
        WebhookEvent.POST_PUBLISHED,
        {
          postId: savedPost.id,
          title: savedPost.title,
          slug: savedPost.slug,
          publishedAt: savedPost.publishedAt,
        },
      );
    }

    return {
      success: true,
      message: 'Post published successfully',
      data: savedPost,
    };
  }

  /**
   * Unpublish a post (move to draft)
   * Changes status to DRAFT
   */
  async unpublish(id: string, user: User) {
    const post = await this.postsRepository.findOne({
      where: { id },
      relations: ['workspace', 'workspace.owner', 'author', 'organization', 'project'],
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Check access
    if (post.workspace && post.workspace.ownerId !== user.id) {
      throw new ForbiddenException('Access denied');
    }

    // Can only unpublish published posts
    if (post.status !== PostStatus.PUBLISHED) {
      throw new ForbiddenException(`Cannot unpublish post with status: ${post.status}`);
    }

    // Update post status
    post.status = PostStatus.DRAFT;
    post.publishedAt = null;
    const savedPost = await this.postsRepository.save(post);

    // Trigger webhook if organization and project exist
    if (post.organizationId && post.projectId) {
      await this.webhookService.triggerWebhook(
        post.organizationId,
        post.projectId,
        WebhookEvent.POST_UPDATED,
        {
          postId: savedPost.id,
          title: savedPost.title,
          slug: savedPost.slug,
          status: savedPost.status,
        },
      );
    }

    return {
      success: true,
      message: 'Post unpublished successfully',
      data: savedPost,
    };
  }

  /**
   * Schedule a post for future publishing
   * POST /posts/:id/schedule
   */
  async schedulePost(id: string, user: User, scheduledAt: Date, revisionId?: string) {
    const post = await this.postsRepository.findOne({
      where: { id },
      relations: ['workspace', 'workspace.owner', 'author', 'revisions'],
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.workspace && post.workspace.ownerId !== user.id) {
      throw new ForbiddenException('Access denied');
    }

    if (scheduledAt <= new Date()) {
      throw new ForbiddenException('Scheduled time must be in the future');
    }

    const schedulableStatuses = [PostStatus.DRAFT, PostStatus.GENERATED, PostStatus.SCHEDULED];
    if (!schedulableStatuses.includes(post.status)) {
      throw new ForbiddenException(`Cannot schedule post with status: ${post.status}`);
    }

    post.status = PostStatus.SCHEDULED;
    post.scheduledAt = scheduledAt;
    post.publishedRevisionId = await this.resolvePublishedRevisionId(post, revisionId);
    const savedPost = await this.postsRepository.save(post);

    return {
      success: true,
      message: 'Post scheduled successfully',
      data: savedPost,
    };
  }

  /**
   * Remove scheduling from a post (revert to draft)
   * POST /posts/:id/unschedule
   */
  async unschedulePost(id: string, user: User) {
    const post = await this.postsRepository.findOne({
      where: { id },
      relations: ['workspace', 'workspace.owner', 'author'],
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.workspace && post.workspace.ownerId !== user.id) {
      throw new ForbiddenException('Access denied');
    }

    if (post.status !== PostStatus.SCHEDULED) {
      throw new ForbiddenException(`Post is not scheduled (current status: ${post.status})`);
    }

    post.status = PostStatus.DRAFT;
    post.scheduledAt = null;
    const savedPost = await this.postsRepository.save(post);

    return {
      success: true,
      message: 'Post unscheduled successfully',
      data: savedPost,
    };
  }

  /**
   * Cron job: publish all posts whose scheduledAt has passed
   * Called by PostsSchedulerService every minute
   */
  async publishScheduledPosts(): Promise<void> {
    const now = new Date();

    const duePosts = await this.postsRepository.find({
      where: {
        status: PostStatus.SCHEDULED,
        scheduledAt: LessThanOrEqual(now),
      },
      relations: ['organization', 'project', 'workspace', 'revisions'],
    });

    if (duePosts.length === 0) return;

    this.logger.log(`Publishing ${duePosts.length} scheduled post(s)`);

    for (const post of duePosts) {
      try {
        const publishedRevisionId =
          post.publishedRevisionId ?? (await this.resolvePublishedRevisionId(post)) ?? null;

        // Claim the post atomically — the scheduler runs in both the API and worker
        // processes, so a plain save() would publish (and webhook) twice.
        const claim = await this.postsRepository
          .createQueryBuilder()
          .update(Post)
          .set({ status: PostStatus.PUBLISHED, publishedAt: now, publishedRevisionId })
          .where('id = :id', { id: post.id })
          .andWhere('status = :scheduled', { scheduled: PostStatus.SCHEDULED })
          .execute();

        if ((claim.affected ?? 0) === 0) {
          // Another process already published it.
          continue;
        }

        post.status = PostStatus.PUBLISHED;
        post.publishedAt = now;
        post.publishedRevisionId = publishedRevisionId;

        if (post.organizationId && post.projectId) {
          await this.webhookService.triggerWebhook(
            post.organizationId,
            post.projectId,
            WebhookEvent.POST_PUBLISHED,
            {
              postId: post.id,
              title: post.title,
              slug: post.slug,
              publishedAt: post.publishedAt,
            },
          );
        }

        this.logger.log(`Scheduled post published: ${post.id} (${post.title})`);
      } catch (err) {
        this.logger.error(`Failed to publish scheduled post ${post.id}: ${err.message}`);
      }
    }
  }

  private async resolvePublishedRevisionId(post: Post, revisionId?: string): Promise<string | null> {
    if (!post.revisions?.length) {
      post.revisions = await this.postRevisionsRepository.find({
        where: { postId: post.id },
        order: { version: 'DESC' },
      });
    }

    if (revisionId) {
      const found = post.revisions?.find((r) => r.id === revisionId);
      if (!found) {
        throw new NotFoundException('Revision not found');
      }
      return revisionId;
    }

    return getLatestRevision(post.revisions)?.id ?? null;
  }
}
