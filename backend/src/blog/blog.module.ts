import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BlogController } from './blog.controller';
import { BlogService } from './blog.service';
import { Post } from '../entities/post.entity';
import { PostRevision } from '../entities/post-revision.entity';
import { PostSeo } from '../entities/post-seo.entity';
import { ApiKey } from '../entities/api-key.entity';
import { ApiKeyRateLimit } from '../entities/api-key-rate-limit.entity';
import { Organization } from '../entities/organization.entity';
import { Project } from '../entities/project.entity';
import { Workspace } from '../entities/workspace.entity';
import { User } from '../entities/user.entity';
import { AuthModule } from '../auth/auth.module';
import { CommonModule } from '../common/common.module';
import { TenantFilterGuard } from '../common/guards/tenant-filter.guard';
import { BlogV1Controller } from './v1/blog-v1.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Post,
      PostRevision,
      PostSeo,
      ApiKey,
      ApiKeyRateLimit,
      Organization,
      Project,
      Workspace,
      User,
    ]),
    AuthModule,
    CommonModule,
  ],
  controllers: [BlogController, BlogV1Controller], // Legacy + v1
  providers: [BlogService, TenantFilterGuard],
})
export class BlogModule {}
