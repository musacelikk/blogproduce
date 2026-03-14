import { Controller, Post, Get, Body, Param, Query, HttpCode, HttpStatus, UseGuards, Req } from '@nestjs/common';
import { BlogService } from './blog.service';
import { GenerateBlogDto } from './dto/generate-blog.dto';
import { ApiKeyOrJwtGuard } from '../auth/guards/api-key-or-jwt.guard';
import { RateLimitGuard } from '../auth/guards/rate-limit.guard';
import { TenantFilterGuard } from '../common/guards/tenant-filter.guard';
import { CurrentApiKey } from '../auth/decorators/api-key.decorator';
import { ApiKey } from '../entities/api-key.entity';
import { CurrentOrganization } from '../auth/decorators/organization.decorator';
import { CurrentProject } from '../auth/decorators/project.decorator';
import { CurrentUser } from '../auth/decorators/user.decorator';
import { Organization } from '../entities/organization.entity';
import { Project } from '../entities/project.entity';
import { User } from '../entities/user.entity';
import { PostStatus } from '../entities/post.entity';

/**
 * Legacy Blog Controller (backward compatibility)
 * 
 * @deprecated Use /v1/api/blog endpoints instead
 * This controller is kept for backward compatibility but will be removed in a future version.
 * All new integrations should use the versioned endpoints.
 */
@Controller('api/blog')
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  @Get()
  @UseGuards(ApiKeyOrJwtGuard, RateLimitGuard, TenantFilterGuard)
  async listBlogs(
    @CurrentOrganization() organization: Organization | undefined,
    @CurrentProject() project: Project | undefined,
    @CurrentUser() user: User | undefined,
    @Query('status') status?: PostStatus,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    // If API key is used, organization and project are already set
    // If JWT is used, we need to get organization and project from user
    let org = organization;
    let proj = project;

    if (!org && user) {
      // For JWT, get user's default organization and project
      const userOrgProj = await this.blogService.getUserOrganizationAndProject(user);
      org = userOrgProj.organization;
      proj = userOrgProj.project;
    }

    if (!org || !proj) {
      throw new Error('Organization and project are required');
    }

    const limitNum = limit ? parseInt(limit, 10) : 50;
    const offsetNum = offset ? parseInt(offset, 10) : 0;
    const result = await this.blogService.listBlogs(org, proj, status, limitNum, offsetNum);
    return {
      success: true,
      data: result.posts,
      meta: {
        total: result.total,
        limit: result.limit,
        offset: result.offset,
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

    const result = await this.blogService.getBlog(org, proj, id);
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

    const result = await this.blogService.getBlogBySlug(org, proj, slug);
    return {
      success: true,
      data: result,
    };
  }
}

