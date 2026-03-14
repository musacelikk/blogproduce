import { Controller, Post, Get, Body, Param, Query, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { BlogService } from '../blog.service';
import { GenerateBlogDto } from '../dto/generate-blog.dto';
import { ApiKeyOrJwtGuard } from '../../auth/guards/api-key-or-jwt.guard';
import { RateLimitGuard } from '../../auth/guards/rate-limit.guard';
import { TenantFilterGuard } from '../../common/guards/tenant-filter.guard';
import { CurrentApiKey } from '../../auth/decorators/api-key.decorator';
import { ApiKey } from '../../entities/api-key.entity';
import { CurrentOrganization } from '../../auth/decorators/organization.decorator';
import { CurrentProject } from '../../auth/decorators/project.decorator';
import { CurrentUser } from '../../auth/decorators/user.decorator';
import { Organization } from '../../entities/organization.entity';
import { Project } from '../../entities/project.entity';
import { User } from '../../entities/user.entity';
import { PostStatus } from '../../entities/post.entity';

/**
 * API v1 Controller
 * 
 * Versioning Strategy:
 * - All endpoints are versioned: /v1/api/blog/...
 * - Breaking changes require new version (v2, v3, etc.)
 * - Response formats are stable within a version
 * - No silent breaking changes - deprecated fields are marked but not removed
 */
@Controller('v1/api/blog')
export class BlogV1Controller {
  constructor(private readonly blogService: BlogService) {}

  @Get()
  @UseGuards(ApiKeyOrJwtGuard, RateLimitGuard, TenantFilterGuard)
  async listBlogs(
    @CurrentOrganization() organization: Organization | undefined,
    @CurrentProject() project: Project | undefined,
    @CurrentUser() user: User | undefined,
    @Query('status') status?: PostStatus,
    @Query('cursor') cursor?: string, // Cursor-based pagination
    @Query('limit') limit?: string,
    // Legacy offset support (deprecated but still works)
    @Query('offset') offset?: string,
  ) {
    let org = organization;
    let proj = project;

    if (!org && user) {
      const userOrgProj = await this.blogService.getUserOrganizationAndProject(user);
      org = userOrgProj.organization;
      proj = userOrgProj.project;
    }

    if (!org || !proj) {
      throw new Error('Organization and project are required');
    }

    // Parse limit (max 100, default 50)
    const limitNum = limit ? Math.min(parseInt(limit, 10), 100) : 50;
    if (limitNum < 1) {
      throw new Error('Limit must be at least 1');
    }

    // ✅ Always use cursor-based pagination for v1 endpoint
    // Cursor is optional - if not provided, it means this is the first page
    // listBlogsWithCursor handles undefined cursor correctly (returns first page)
    const result = await this.blogService.listBlogsWithCursor(org, proj, status, cursor, limitNum);
    return {
      success: true,
      data: result.posts,
      meta: {
        next_cursor: result.nextCursor,
        has_more: result.hasMore,
        limit: limitNum,
      },
    };
  }

  @Get(':id')
  @UseGuards(ApiKeyOrJwtGuard, RateLimitGuard, TenantFilterGuard)
  async getBlog(
    @CurrentOrganization() organization: Organization | undefined,
    @CurrentProject() project: Project | undefined,
    @CurrentUser() user: User | undefined,
    @Param('id') id: string,
    @Query('format') format?: string,
  ) {
    let org = organization;
    let proj = project;

    if (!org && user) {
      const userOrgProj = await this.blogService.getUserOrganizationAndProject(user);
      org = userOrgProj.organization;
      proj = userOrgProj.project;
    }

    if (!org || !proj) {
      throw new Error('Organization and project are required');
    }

    const result = await this.blogService.getBlog(org, proj, id, format);
    return {
      success: true,
      data: result,
    };
  }

  @Get('slug/:slug')
  @UseGuards(ApiKeyOrJwtGuard, RateLimitGuard, TenantFilterGuard)
  async getBlogBySlug(
    @CurrentOrganization() organization: Organization | undefined,
    @CurrentProject() project: Project | undefined,
    @CurrentUser() user: User | undefined,
    @Param('slug') slug: string,
    @Query('format') format?: string,
  ) {
    let org = organization;
    let proj = project;

    if (!org && user) {
      const userOrgProj = await this.blogService.getUserOrganizationAndProject(user);
      org = userOrgProj.organization;
      proj = userOrgProj.project;
    }

    if (!org || !proj) {
      throw new Error('Organization and project are required');
    }

    const result = await this.blogService.getBlogBySlug(org, proj, slug, format);
    return {
      success: true,
      data: result,
    };
  }
}

