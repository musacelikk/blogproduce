import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Post, PostStatus } from '../entities/post.entity';
import { PostRevision } from '../entities/post-revision.entity';
import { PostSeo } from '../entities/post-seo.entity';
import { Organization } from '../entities/organization.entity';
import { Project } from '../entities/project.entity';
import { Workspace } from '../entities/workspace.entity';
import { User } from '../entities/user.entity';
import { ApiKey } from '../entities/api-key.entity';
import { HtmlSanitizerService } from '../common/services/html-sanitizer.service';
import { markdownToHtml, calculateReadingTime } from '../common/utils/markdown-to-html.util';
import { encodeCursor, decodeCursor } from '../common/utils/cursor.util';
import {
  jsonToMarkdown,
  convertContentFormat,
  parseFormat,
} from '../common/utils/content-format.util';
import { ContentFormat } from '../entities/post-revision.entity';
import { getPublishedRevision, sortRevisionsDesc } from '../common/utils/revision.util';

@Injectable()
export class BlogService {
  constructor(
    @InjectRepository(Post)
    private postRepository: Repository<Post>,
    @InjectRepository(PostRevision)
    private postRevisionRepository: Repository<PostRevision>,
    @InjectRepository(PostSeo)
    private postSeoRepository: Repository<PostSeo>,
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
    @InjectRepository(Workspace)
    private workspaceRepository: Repository<Workspace>,
    @InjectRepository(ApiKey)
    private apiKeyRepository: Repository<ApiKey>,
    private configService: ConfigService,
    private htmlSanitizer: HtmlSanitizerService,
  ) {}

  private generateExcerpt(content: string, title: string, maxLength: number = 160): string {
    if (!content) {
      return '';
    }

    // Remove markdown headers and get first paragraph
    const plainText =
      content
        .replace(/#{1,6}\s+/g, '') // Remove headers
        .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold
        .replace(/\*([^*]+)\*/g, '$1') // Remove italic
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links
        .replace(/`([^`]+)`/g, '$1') // Remove code
        .split('\n\n')
        .find((para) => para.trim().length > 20) || '';

    if (plainText.length <= maxLength) {
      return plainText.trim();
    }

    // Truncate at word boundary
    const truncated = plainText.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    return truncated.substring(0, lastSpace > 0 ? lastSpace : maxLength) + '...';
  }

  /**
   * List blogs with offset-based pagination (legacy)
   * @deprecated Use listBlogsWithCursor for better performance and stability
   */
  async listBlogs(
    organization: Organization,
    project: Project,
    status?: PostStatus,
    limit: number = 50,
    offset: number = 0,
  ) {
    const where: any = {
      organizationId: organization.id,
      projectId: project.id,
      hiddenByAdmin: false,
    };

    if (status) {
      where.status = status;
    }

    const [posts, total] = await this.postRepository.findAndCount({
      where,
      relations: ['tags', 'author', 'coverImage'],
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });

    return {
      posts: posts.map((post) => this.formatPostForApi(post)),
      total,
      limit,
      offset,
    };
  }

  /**
   * List blogs with cursor-based pagination (recommended)
   * Cursor format: base64(JSON({ timestamp, id }))
   */
  async listBlogsWithCursor(
    organization: Organization,
    project: Project,
    status?: PostStatus,
    cursor?: string,
    limit: number = 50,
  ) {
    const where: any = {
      organizationId: organization.id,
      projectId: project.id,
      hiddenByAdmin: false,
    };

    if (status) {
      where.status = status;
    }

    // Decode cursor if provided
    let cursorTimestamp: Date | undefined;
    let cursorId: string | undefined;

    if (cursor) {
      const cursorData = decodeCursor(cursor);
      if (cursorData) {
        cursorTimestamp = new Date(cursorData.timestamp);
        cursorId = cursorData.id;
      }
    }

    // Build query with cursor
    const queryBuilder = this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.tags', 'tags')
      .leftJoinAndSelect('post.author', 'author')
      .leftJoinAndSelect('post.coverImage', 'coverImage')
      .where('post.organizationId = :organizationId', { organizationId: organization.id })
      .andWhere('post.projectId = :projectId', { projectId: project.id })
      .andWhere('post.hiddenByAdmin = :hiddenByAdmin', { hiddenByAdmin: false });

    if (status) {
      queryBuilder.andWhere('post.status = :status', { status });
    }

    // Apply cursor filter
    if (cursorTimestamp && cursorId) {
      queryBuilder.andWhere(
        '(post.createdAt < :cursorTimestamp OR (post.createdAt = :cursorTimestamp AND post.id < :cursorId))',
        {
          cursorTimestamp,
          cursorId,
        },
      );
    }

    queryBuilder
      .orderBy('post.createdAt', 'DESC')
      .addOrderBy('post.id', 'DESC')
      .take(limit + 1); // Fetch one extra to check if there's more

    const posts = await queryBuilder.getMany();

    // Check if there are more items
    const hasMore = posts.length > limit;
    const resultPosts = hasMore ? posts.slice(0, limit) : posts;

    // Generate next cursor from the last post
    let nextCursor: string | null = null;
    if (hasMore && resultPosts.length > 0) {
      const lastPost = resultPosts[resultPosts.length - 1];
      nextCursor = encodeCursor(lastPost.createdAt, lastPost.id);
    }

    return {
      posts: resultPosts.map((post) => this.formatPostForApi(post)),
      nextCursor,
      hasMore,
      limit,
    };
  }

  async getBlog(organization: Organization, project: Project, id: string, format?: string) {
    const post = await this.postRepository.findOne({
      where: {
        id,
        organizationId: organization.id,
        projectId: project.id,
        hiddenByAdmin: false,
      },
      relations: ['tags', 'author', 'coverImage', 'seo', 'revisions'],
    });

    if (!post) {
      throw new NotFoundException('Blog post not found');
    }

    if (post.revisions && post.revisions.length > 0) {
      post.revisions = sortRevisionsDesc(post.revisions);
    }

    return this.formatPostForApi(post, true, format);
  }

  async getBlogBySlug(organization: Organization, project: Project, slug: string, format?: string) {
    const post = await this.postRepository.findOne({
      where: {
        slug,
        organizationId: organization.id,
        projectId: project.id,
        hiddenByAdmin: false,
      },
      relations: ['tags', 'author', 'coverImage', 'seo', 'revisions'],
    });

    if (!post) {
      throw new NotFoundException('Blog post not found');
    }

    if (post.revisions && post.revisions.length > 0) {
      post.revisions = sortRevisionsDesc(post.revisions);
    }

    return this.formatPostForApi(post, true, format);
  }

  private formatPostForApi(post: Post, includeContent: boolean = false, format?: string) {
    const activeRevision = includeContent ? getPublishedRevision(post) : null;
    const rawContent = activeRevision?.content ?? null;
    const storedFormat = activeRevision?.contentFormat ?? ContentFormat.MD;

    // Canonical JSON → markdown; MD/HTML → uygun işleme
    let contentMarkdown: string | null = null;
    if (rawContent) {
      if (storedFormat === ContentFormat.JSON) {
        contentMarkdown = jsonToMarkdown(rawContent) || null;
      } else if (storedFormat === ContentFormat.MD) {
        contentMarkdown = rawContent;
      } else if (storedFormat === ContentFormat.HTML) {
        contentMarkdown = null;
      } else {
        contentMarkdown = rawContent;
      }
      if (contentMarkdown && this.htmlSanitizer.isDangerous(contentMarkdown)) {
        contentMarkdown = this.htmlSanitizer.sanitize(contentMarkdown, true);
      }
    }

    let contentHtml: string | undefined;
    if (storedFormat === ContentFormat.HTML && rawContent) {
      contentHtml = this.htmlSanitizer.sanitize(rawContent, true);
    } else if (contentMarkdown) {
      contentHtml = this.htmlSanitizer.sanitize(markdownToHtml(contentMarkdown), true);
    } else {
      contentHtml = undefined;
    }

    // Calculate reading time
    const readingTime = contentMarkdown ? calculateReadingTime(contentMarkdown) : undefined;

    // Extract excerpt
    const excerpt =
      post.excerpt ||
      (contentMarkdown ? this.generateExcerpt(contentMarkdown, post.title) : undefined);

    // Extract TOC, FAQ, and schema — primarily from the revision's canonical JSON
    // (which the AI pipeline populates), falling back to the stored SEO record.
    let toc: Array<{ id: string; title: string; level: number }> | undefined;
    let faq: Array<{ question: string; answer: string }> | undefined;
    let schemaJsonld: Record<string, any> | undefined;

    if (rawContent && storedFormat === ContentFormat.JSON) {
      try {
        const parsed = JSON.parse(rawContent);
        if (Array.isArray(parsed?.metadata?.toc) && parsed.metadata.toc.length > 0) {
          toc = parsed.metadata.toc;
        }
        if (Array.isArray(parsed?.metadata?.faq) && parsed.metadata.faq.length > 0) {
          faq = parsed.metadata.faq;
        }
      } catch {
        // Not canonical JSON — fall through to the SEO record below.
      }
    }

    if (post.seo?.schemaJsonld) {
      try {
        const schema =
          typeof post.seo.schemaJsonld === 'string'
            ? JSON.parse(post.seo.schemaJsonld)
            : post.seo.schemaJsonld;

        // The worker stores Article + FAQPage together under @graph
        const nodes: any[] = Array.isArray(schema['@graph']) ? schema['@graph'] : [schema];

        for (const node of nodes) {
          if (node?.['@type'] === 'FAQPage' && Array.isArray(node.mainEntity)) {
            if (!faq) {
              faq = node.mainEntity.map((item: any) => ({
                question: item.name || '',
                answer: item.acceptedAnswer?.text || '',
              }));
            }
            schemaJsonld = { ...(schemaJsonld || {}), faqPage: node };
          } else if (node?.['@type'] === 'Article') {
            schemaJsonld = { ...(schemaJsonld || {}), article: node };
          }
        }
      } catch (e) {
        // Invalid JSON, skip
      }
    }

    // Parse cover image credit if exists
    let coverImageCredit: { name: string; photographer_url: string; photo_url: string } | undefined;
    if (post.coverImageCreditJson) {
      try {
        const credit =
          typeof post.coverImageCreditJson === 'string'
            ? JSON.parse(post.coverImageCreditJson)
            : post.coverImageCreditJson;
        if (credit) {
          coverImageCredit = {
            name: credit.name || '',
            photographer_url: credit.photographerUrl || credit.photographer_url || '',
            photo_url: credit.photoUrl || credit.photo_url || '',
          };
        }
      } catch (e) {
        // Invalid JSON, skip
      }
    }

    const formatted: any = {
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt,
      status: post.status,
      language: post.language,
      cover_image_url: post.coverImageUrl,
      cover_image_credit: coverImageCredit,
      canonical_url: post.canonicalUrl,
      published_at: post.publishedAt,
      created_at: post.createdAt,
      updated_at: post.updatedAt,
      tags:
        post.tags?.map((tag) => ({
          id: tag.id,
          name: tag.name,
          slug: tag.slug,
        })) || [],
      categories: [], // TODO: Add categories when implemented
      author: post.author
        ? {
            id: post.author.id,
            name: post.author.name,
            email: post.author.email,
          }
        : null,
    };

    if (includeContent && rawContent) {
      const requestedFormat = parseFormat(format) || ContentFormat.JSON;
      try {
        formatted.content = convertContentFormat(rawContent, storedFormat, requestedFormat);
        formatted.contentFormat =
          requestedFormat === ContentFormat.JSON
            ? 'json'
            : requestedFormat === ContentFormat.MD
              ? 'md'
              : 'html';
      } catch {
        formatted.content = rawContent;
        formatted.contentFormat = 'json';
      }
      if (contentMarkdown) {
        formatted.content_markdown = contentMarkdown;
      }
      if (contentHtml) {
        formatted.content_html = contentHtml;
      }
      formatted.reading_time = readingTime;

      if (toc) {
        formatted.toc = toc;
      }
      if (faq) {
        formatted.faq = faq;
      }
      if (schemaJsonld) {
        formatted.schema_jsonld = schemaJsonld;
      }

      // Include legacy SEO data for backward compatibility
      if (post.seo) {
        formatted.seo = {
          metaTitle: post.seo.metaTitle,
          metaDescription: post.seo.metaDescription,
          ogTitle: post.seo.ogTitle,
          ogDescription: post.seo.ogDescription,
          robots: post.seo.robots,
          schemaJsonld: post.seo.schemaJsonld,
        };
      }
    }

    return formatted;
  }

  async getUserOrganizationAndProject(
    user: User,
  ): Promise<{ organization: Organization; project: Project }> {
    // Get user's first workspace (or create a default one)
    let workspace = await this.workspaceRepository.findOne({
      where: { ownerId: user.id },
      order: { createdAt: 'ASC' },
    });

    if (!workspace) {
      workspace = this.workspaceRepository.create({
        name: 'My Workspace',
        ownerId: user.id,
      });
      workspace = await this.workspaceRepository.save(workspace);
    }

    // ✅ Find or create Organization for this specific workspace
    // Use workspace-specific organization name to match API key creation logic
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

    // Find or create Project for the workspace within the organization
    // ✅ Use workspace.id as project slug to match with API keys and posts
    const projectSlug = workspace.id; // Use workspace ID as project slug
    let project = await this.projectRepository.findOne({
      where: { organizationId: organization.id, slug: projectSlug },
    });

    if (!project) {
      project = this.projectRepository.create({
        organizationId: organization.id,
        name: workspace.name,
        slug: projectSlug, // Use workspace.id as slug
        description: workspace.description || `Project for workspace: ${workspace.name}`,
        active: true,
      });
      project = await this.projectRepository.save(project);
    }

    return { organization, project };
  }
}
