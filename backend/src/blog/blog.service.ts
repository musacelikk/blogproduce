import { Injectable, HttpException, HttpStatus, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { GenerateBlogDto } from './dto/generate-blog.dto';
import { SeoService } from './seo.service';
import { Post, PostStatus } from '../entities/post.entity';
import { PostRevision } from '../entities/post-revision.entity';
import { PostSeo } from '../entities/post-seo.entity';
import { Organization } from '../entities/organization.entity';
import { Project } from '../entities/project.entity';
import { Workspace } from '../entities/workspace.entity';
import { User } from '../entities/user.entity';
import { ApiKey } from '../entities/api-key.entity';
import { ApiKeyQuotaService } from '../auth/services/api-key-quota.service';
import { HtmlSanitizerService } from '../common/services/html-sanitizer.service';
import { markdownToHtml, calculateReadingTime } from '../common/utils/markdown-to-html.util';
import { encodeCursor, decodeCursor } from '../common/utils/cursor.util';
import { jsonToMarkdown, convertContentFormat, parseFormat } from '../common/utils/content-format.util';
import { ContentFormat } from '../entities/post-revision.entity';
import { getPublishedRevision, sortRevisionsDesc } from '../common/utils/revision.util';

export interface GenerateBlogResponse {
  title: string;
  content_markdown: string; // Primary content format (safe)
  content_html?: string; // Optional sanitized HTML
  excerpt?: string;
  cover_image_url?: string;
  cover_image_credit?: {
    name: string;
    photographer_url: string;
    photo_url: string;
  };
  tags?: Array<{ id: string; name: string; slug: string }>;
  categories?: Array<{ id: string; name: string; slug: string }>;
  toc?: Array<{ id: string; title: string; level: number }>; // Table of contents
  faq?: Array<{ question: string; answer: string }>;
  schema_jsonld?: {
    article?: Record<string, any>;
    faqPage?: Record<string, any>;
  };
  reading_time?: number; // Reading time in minutes
  // Legacy SEO fields (kept for backward compatibility)
  seo?: {
    metaTitle: string;
    metaDescription: string;
    titleAlternatives: string[];
    h1Structure: string[];
    h2Structure: string[];
    faq: Array<{ question: string; answer: string }>;
    jsonLdSchema: {
      article?: Record<string, any>;
      faqPage?: Record<string, any>;
    };
    internalLinks: Array<{ text: string; url: string; anchor: string }>;
    slug: string;
    canonicalUrl: string;
    tableOfContents: Array<{ id: string; title: string; level: number }>;
    coverImagePrompt: string;
    coverImageAltText: string;
    coverImageUrl?: string;
    coverImageCredit?: {
      name: string;
      photographerUrl: string;
      photoUrl: string;
    };
    readabilityScore: number;
    aiFootprintReduced: boolean;
  };
}

@Injectable()
export class BlogService {
  private openai: OpenAI;

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
    private seoService: SeoService,
    private quotaService: ApiKeyQuotaService,
    private htmlSanitizer: HtmlSanitizerService,
  ) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }
    this.openai = new OpenAI({
      apiKey: apiKey,
    });
  }

  async generateBlog(dto: GenerateBlogDto, apiKeyId?: string): Promise<GenerateBlogResponse> {
    try {
      const prompt = this.buildPrompt(dto);
      const seoEnabled = dto.options?.seo?.enabled === true;

      // Estimate token usage (rough estimate: ~4 chars per token)
      const estimatedInputTokens = Math.ceil((prompt.length + this.buildSystemPrompt(seoEnabled).length) / 4);
      const estimatedOutputTokens = 2000; // max_tokens
      const estimatedTotalTokens = estimatedInputTokens + estimatedOutputTokens;

      // Check token budget if API key is provided
      if (apiKeyId) {
        await this.quotaService.checkTokenBudget(apiKeyId, estimatedTotalTokens);
      }

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: this.buildSystemPrompt(seoEnabled),
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      });

      const generatedContent = completion.choices[0]?.message?.content;
      
      // Record actual token usage
      if (apiKeyId && completion.usage) {
        const actualTokens = (completion.usage.prompt_tokens || 0) + (completion.usage.completion_tokens || 0);
        await this.quotaService.recordTokenUsage(apiKeyId, actualTokens);
      }

      if (!generatedContent) {
        throw new HttpException(
          'Failed to generate blog content',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      const title = this.extractTitle(generatedContent, dto.topic);
      let contentMarkdown = this.cleanContent(generatedContent, title);

      // Sanitize content if it contains dangerous HTML (XSS protection)
      if (contentMarkdown && this.htmlSanitizer.isDangerous(contentMarkdown)) {
        contentMarkdown = this.htmlSanitizer.sanitize(contentMarkdown, true);
      }

      // Calculate reading time
      const readingTime = calculateReadingTime(contentMarkdown);

      // Generate excerpt from first paragraph
      const excerpt = this.generateExcerpt(contentMarkdown, title);

      // Build base response
      const response: GenerateBlogResponse = {
        title,
        content_markdown: contentMarkdown,
        excerpt,
        reading_time: readingTime,
      };

      if (seoEnabled) {
        if (contentMarkdown) {
          contentMarkdown = await this.enhanceContentReadability(contentMarkdown);
          // Re-sanitize after readability enhancement
          if (this.htmlSanitizer.isDangerous(contentMarkdown)) {
            contentMarkdown = this.htmlSanitizer.sanitize(contentMarkdown, true);
          }
          response.content_markdown = contentMarkdown;
          // Recalculate reading time after enhancement
          response.reading_time = calculateReadingTime(contentMarkdown);
        }

        const seoMetadata = await this.seoService.generateSeoMetadata(
          title,
          contentMarkdown,
          dto.topic,
          dto.workspaceId,
        );

        // Convert markdown to HTML and sanitize
        const contentHtml = markdownToHtml(contentMarkdown);
        response.content_html = this.htmlSanitizer.sanitize(contentHtml, true);

        // Map SEO metadata to new format
        response.toc = seoMetadata.tableOfContents;
        response.faq = seoMetadata.faq;
        response.schema_jsonld = seoMetadata.jsonLdSchema;
        response.cover_image_url = seoMetadata.coverImageUrl;
        if (seoMetadata.coverImageCredit) {
          response.cover_image_credit = {
            name: seoMetadata.coverImageCredit.name,
            photographer_url: seoMetadata.coverImageCredit.photographerUrl,
            photo_url: seoMetadata.coverImageCredit.photoUrl,
          };
        }

        // Keep legacy SEO format for backward compatibility
        response.seo = seoMetadata;
      } else {
        // Even without SEO, provide HTML version
        const contentHtml = markdownToHtml(contentMarkdown);
        response.content_html = this.htmlSanitizer.sanitize(contentHtml, true);
      }

      return response;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        error.message || 'Failed to generate blog',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private buildSystemPrompt(seoEnabled: boolean): string {
    let systemPrompt =
      'You are an expert blog writer. Write engaging, well-structured blog posts with clear headings, subheadings, and a compelling introduction and conclusion. Format the content in markdown.';

    if (seoEnabled) {
      systemPrompt +=
        '\n\nSEO Requirements:\n' +
        '- Use short paragraphs (2-3 sentences max)\n' +
        '- Include bullet points and lists where appropriate\n' +
        '- Avoid repetitive phrases and AI clichés\n' +
        '- Use natural, conversational language\n' +
        '- Include specific examples and case studies\n' +
        '- Ensure proper H1/H2 hierarchy\n' +
        '- Write in a way that reduces AI detection';
    }

    return systemPrompt;
  }

  private async enhanceContentReadability(content: string): Promise<string> {
    if (!this.openai) {
      return content;
    }

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'Improve content readability by: breaking long paragraphs into shorter ones (2-3 sentences), adding bullet points where appropriate, removing repetitive phrases, and making it more natural. Keep the same meaning and structure.',
          },
          {
            role: 'user',
            content: `Improve readability of this content:\n\n${content}`,
          },
        ],
        temperature: 0.8,
        max_tokens: 2000,
      });

      const improved = completion.choices[0]?.message?.content;
      return improved || content;
    } catch (error) {
      console.error('Error enhancing readability:', error);
      return content;
    }
  }

  private buildPrompt(dto: GenerateBlogDto): string {
    let prompt = `Write a comprehensive blog post about: ${dto.topic}\n\n`;

    if (dto.additionalContext) {
      prompt += `Additional context: ${dto.additionalContext}\n\n`;
    }

    if (dto.tone) {
      prompt += `Tone: ${dto.tone}\n\n`;
    }

    if (dto.targetAudience) {
      prompt += `Target audience: ${dto.targetAudience}\n\n`;
    }

    prompt +=
      'The blog post should:\n' +
      '- Have a compelling title\n' +
      '- Include an engaging introduction\n' +
      '- Have well-structured sections with clear headings\n' +
      '- Be informative and valuable\n' +
      '- Include a conclusion\n' +
      '- Be formatted in markdown\n' +
      '- Be approximately 800-1200 words\n\n' +
      'Start with the title as an H1 heading, then write the content.';

    return prompt;
  }

  private generateExcerpt(content: string, title: string, maxLength: number = 160): string {
    if (!content) {
      return '';
    }

    // Remove markdown headers and get first paragraph
    const plainText = content
      .replace(/#{1,6}\s+/g, '') // Remove headers
      .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold
      .replace(/\*([^*]+)\*/g, '$1') // Remove italic
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links
      .replace(/`([^`]+)`/g, '$1') // Remove code
      .split('\n\n')
      .find(para => para.trim().length > 20) || '';

    if (plainText.length <= maxLength) {
      return plainText.trim();
    }

    // Truncate at word boundary
    const truncated = plainText.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    return truncated.substring(0, lastSpace > 0 ? lastSpace : maxLength) + '...';
  }

  private extractTitle(content: string, fallbackTopic: string): string {
    const titleMatch = content.match(/^#\s+(.+)$/m);
    if (titleMatch && titleMatch[1]) {
      return titleMatch[1].trim();
    }

    const firstLine = content.split('\n')[0]?.trim();
    if (firstLine && firstLine.length > 0 && firstLine.length < 100) {
      return firstLine.replace(/^#+\s*/, '');
    }

    return `Blog Post: ${fallbackTopic}`;
  }

  private cleanContent(content: string, title: string): string {
    let cleaned = content.trim();

    if (cleaned.startsWith('#')) {
      const lines = cleaned.split('\n');
      const firstLine = lines[0];
      if (firstLine.includes(title)) {
        cleaned = lines.slice(1).join('\n').trim();
      }
    }

    if (!cleaned.startsWith('#')) {
      cleaned = `# ${title}\n\n${cleaned}`;
    }

    return cleaned;
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
    const excerpt = post.excerpt || (contentMarkdown ? this.generateExcerpt(contentMarkdown, post.title) : undefined);

    // Extract TOC, FAQ, and schema from SEO data
    let toc: Array<{ id: string; title: string; level: number }> | undefined;
    let faq: Array<{ question: string; answer: string }> | undefined;
    let schemaJsonld: Record<string, any> | undefined;

    if (post.seo?.schemaJsonld) {
      try {
        const schema = typeof post.seo.schemaJsonld === 'string' 
          ? JSON.parse(post.seo.schemaJsonld) 
          : post.seo.schemaJsonld;
        
        // Extract FAQPage schema if exists
        if (schema['@type'] === 'FAQPage' && schema.mainEntity) {
          faq = schema.mainEntity.map((item: any) => ({
            question: item.name || '',
            answer: item.acceptedAnswer?.text || '',
          }));
        }

        // Extract Article schema
        if (schema['@type'] === 'Article') {
          schemaJsonld = { article: schema };
        } else if (schema['@type'] === 'FAQPage') {
          schemaJsonld = { faqPage: schema };
        }
      } catch (e) {
        // Invalid JSON, skip
      }
    }

    // Parse cover image credit if exists
    let coverImageCredit: { name: string; photographer_url: string; photo_url: string } | undefined;
    if (post.coverImageCreditJson) {
      try {
        const credit = typeof post.coverImageCreditJson === 'string'
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
      tags: post.tags?.map((tag) => ({
        id: tag.id,
        name: tag.name,
        slug: tag.slug,
      })) || [],
      categories: [], // TODO: Add categories when implemented
      author: post.author ? {
        id: post.author.id,
        name: post.author.name,
        email: post.author.email,
      } : null,
    };

    if (includeContent && rawContent) {
      const requestedFormat = parseFormat(format) || ContentFormat.JSON;
      try {
        formatted.content = convertContentFormat(rawContent, storedFormat, requestedFormat);
        formatted.contentFormat = requestedFormat === ContentFormat.JSON ? 'json' : requestedFormat === ContentFormat.MD ? 'md' : 'html';
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

  async getUserOrganizationAndProject(user: User): Promise<{ organization: Organization; project: Project }> {
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

