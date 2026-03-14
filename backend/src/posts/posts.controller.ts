import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { GeneratePostDto } from './dto/generate-post.dto';
import { PostStatus } from '../entities/post.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/user.decorator';
import { User } from '../entities/user.entity';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  /**
   * Public endpoint for fetching published posts
   * GET /posts/public
   * No authentication required - for ISR/cron usage
   */
  @Get('public')
  async findPublic(
    @Query('limit') limit?: string,
    @Query('ids') ids?: string,
    @Query('organizationId') organizationId?: string,
    @Query('projectId') projectId?: string,
    @Query('slug') slug?: string,
  ) {
    const postIds = ids ? ids.split(',').filter(Boolean) : undefined;
    const posts = await this.postsService.findPublic(
      limit ? parseInt(limit, 10) : 10,
      postIds,
      organizationId,
      projectId,
      slug,
    );
    return {
      success: true,
      data: posts,
    };
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@CurrentUser() user: User, @Body() createPostDto: CreatePostDto) {
    return this.postsService.create(user, createPostDto);
  }

  /**
   * Generate a post
   * POST /posts/generate
   */
  @Post('generate')
  @UseGuards(JwtAuthGuard)
  async generate(@CurrentUser() user: User, @Body() generatePostDto: GeneratePostDto) {
    return this.postsService.generate(user, generatePostDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(
    @CurrentUser() user: User,
    @Query('workspaceId') workspaceId?: string,
    @Query('status') status?: PostStatus,
  ) {
    return this.postsService.findAll(user, workspaceId, status);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.postsService.findOne(id, user);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() updatePostDto: UpdatePostDto,
  ) {
    return this.postsService.update(id, user, updatePostDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.postsService.remove(id, user);
  }

  /**
   * Publish a post
   * POST /posts/:id/publish
   */
  @Post(':id/publish')
  @UseGuards(JwtAuthGuard)
  async publish(@Param('id') id: string, @CurrentUser() user: User) {
    return this.postsService.publish(id, user);
  }

  /**
   * Unpublish a post
   * POST /posts/:id/unpublish
   */
  @Post(':id/unpublish')
  @UseGuards(JwtAuthGuard)
  async unpublish(@Param('id') id: string, @CurrentUser() user: User) {
    return this.postsService.unpublish(id, user);
  }
}
