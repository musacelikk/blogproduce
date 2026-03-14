import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { Post } from '../entities/post.entity';
import { Workspace } from '../entities/workspace.entity';
import { Tag } from '../entities/tag.entity';
import { PostRevision } from '../entities/post-revision.entity';
import { GenerationJob } from '../entities/generation-job.entity';
import { Organization } from '../entities/organization.entity';
import { Project } from '../entities/project.entity';
import { QueueModule } from '../queue/queue.module';
import { WebhooksModule } from '../webhooks/webhooks.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Post, Workspace, Tag, PostRevision, GenerationJob, Organization, Project]),
    QueueModule,
    WebhooksModule,
    CommonModule,
  ],
  controllers: [PostsController],
  providers: [PostsService],
  exports: [PostsService],
})
export class PostsModule {}
