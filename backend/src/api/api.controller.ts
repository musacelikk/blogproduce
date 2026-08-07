import {
  Controller,
  Delete,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Headers,
  NotFoundException,
} from '@nestjs/common';
import { ApiService } from './api.service';
import { GenerateApiDto } from './dto/generate-api.dto';
import { PublishApiDto } from './dto/publish-api.dto';
import { UpdatePostApiDto } from './dto/update-post-api.dto';
import { ApiKeyGuard } from '../auth/guards/api-key.guard';
import { HmacAuthGuard } from '../auth/guards/hmac-auth.guard';
import { CurrentOrganization } from '../auth/decorators/organization.decorator';
import { CurrentProject } from '../auth/decorators/project.decorator';
import { Organization } from '../entities/organization.entity';
import { Project } from '../entities/project.entity';
import { PostStatus } from '../entities/post.entity';

@Controller('api/v1')
// Support both Bearer token and HMAC authentication
@UseGuards(ApiKeyGuard)
export class ApiController {
  constructor(private readonly apiService: ApiService) {}

  @Post('posts:generate')
  @HttpCode(HttpStatus.OK)
  async generate(
    @CurrentOrganization() organization: Organization,
    @CurrentProject() project: Project,
    @Body() dto: GenerateApiDto,
    // Express parses 'posts:generate' as the literal 'posts' plus a param, so a
    // typo'd URL like /api/v1/postsX would otherwise start (and bill) a generation.
    @Param('generate') action: string,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    if (action !== ':generate') {
      throw new NotFoundException('Cannot POST this path');
    }

    const result = await this.apiService.generate(organization, project, dto, idempotencyKey);
    return {
      success: true,
      data: result,
    };
  }

  @Get('jobs/:jobId')
  async getJob(
    @CurrentOrganization() organization: Organization,
    @CurrentProject() project: Project,
    @Param('jobId') jobId: string,
  ) {
    const result = await this.apiService.getJob(organization, project, jobId);
    return {
      success: true,
      data: result,
    };
  }

  @Post('publish')
  @HttpCode(HttpStatus.OK)
  async publish(
    @CurrentOrganization() organization: Organization,
    @CurrentProject() project: Project,
    @Body() dto: PublishApiDto,
  ) {
    const result = await this.apiService.publish(organization, project, dto);
    return {
      success: true,
      data: result,
    };
  }

  @Get('posts')
  async listPosts(
    @CurrentOrganization() organization: Organization,
    @CurrentProject() project: Project,
    @Query('status') status?: PostStatus,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 50;
    const result = await this.apiService.listPostsWithCursor(organization, project, status, limitNum, cursor);
    return {
      success: true,
      data: result,
    };
  }

  @Get('posts/:id')
  async getPost(
    @CurrentOrganization() organization: Organization,
    @CurrentProject() project: Project,
    @Param('id') id: string,
    @Query('format') format?: string,
  ) {
    const post = await this.apiService.getPost(organization, project, id, format);
    return {
      success: true,
      data: post,
    };
  }

  @Patch('posts/:id')
  async updatePost(
    @CurrentOrganization() organization: Organization,
    @CurrentProject() project: Project,
    @Param('id') id: string,
    @Body() dto: UpdatePostApiDto,
  ) {
    const result = await this.apiService.updatePost(organization, project, id, dto);
    return {
      success: true,
      data: result,
    };
  }

  /** Permanently deletes the post, its revisions and SEO data. Irreversible. */
  @Delete('posts/:id')
  async deletePost(
    @CurrentOrganization() organization: Organization,
    @CurrentProject() project: Project,
    @Param('id') id: string,
  ) {
    const result = await this.apiService.deletePost(organization, project, id);
    return {
      success: true,
      data: result,
    };
  }

  // NOTE: Express 4 cannot parse two adjacent params ('posts/:id:publish' captures a
  // single character into :id), so the publish action uses a path segment.
  @Post('posts/:id/publish')
  @HttpCode(HttpStatus.OK)
  async publishPost(
    @CurrentOrganization() organization: Organization,
    @CurrentProject() project: Project,
    @Param('id') id: string,
    @Body() dto: PublishApiDto,
  ) {
    // Use the postId from URL if not in body
    const publishDto = { ...dto, postId: id };
    const result = await this.apiService.publish(organization, project, publishDto);
    return {
      success: true,
      data: result,
    };
  }

  // Public endpoints - can use HMAC for extra security (optional, also supports Bearer token)
  @Get('published')
  async getPublishedPosts(
    @CurrentOrganization() organization: Organization,
    @CurrentProject() project: Project,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 50;
    const result = await this.apiService.getPublishedPosts(organization, project, limitNum, cursor);
    return {
      success: true,
      data: result,
    };
  }

  @Get('published/:slug')
  async getPublishedPost(
    @CurrentOrganization() organization: Organization,
    @CurrentProject() project: Project,
    @Param('slug') slug: string,
    @Query('format') format?: string,
  ) {
    const post = await this.apiService.getPublishedPost(organization, project, slug, format);
    return {
      success: true,
      data: post,
    };
  }
}

// Public endpoints (no authentication required, but can use signed token)
@Controller('api/v1/public/projects')
export class PublicApiController {
  constructor(private readonly apiService: ApiService) {}

  @Get(':projectSlug/posts')
  async getPublicPosts(
    @Param('projectSlug') projectSlug: string,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 50;
    const result = await this.apiService.getPublicPostsByProjectSlug(projectSlug, limitNum, cursor);
    return {
      success: true,
      data: result,
    };
  }

  @Get(':projectSlug/posts/:slug')
  async getPublicPost(
    @Param('projectSlug') projectSlug: string,
    @Param('slug') slug: string,
    @Query('format') format?: string,
  ) {
    const post = await this.apiService.getPublicPostByProjectSlug(projectSlug, slug, format);
    return {
      success: true,
      data: post,
    };
  }
}

