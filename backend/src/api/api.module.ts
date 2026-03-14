import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApiController, PublicApiController } from './api.controller';
import { ApiService } from './api.service';
import { Post } from '../entities/post.entity';
import { PostRevision } from '../entities/post-revision.entity';
import { Organization } from '../entities/organization.entity';
import { Project } from '../entities/project.entity';
import { Webhook } from '../entities/webhook.entity';
import { ApiKey } from '../entities/api-key.entity';
import { ApiKeySecret } from '../entities/api-key-secret.entity';
import { GenerationJob } from '../entities/generation-job.entity';
import { UsageEvent } from '../entities/usage-event.entity';
import { IdempotencyKey } from '../entities/idempotency-key.entity';
import { PostsModule } from '../posts/posts.module';
import { QueueModule } from '../queue/queue.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Post,
      PostRevision,
      Organization,
      Project,
      Webhook,
      ApiKey,
      ApiKeySecret,
      GenerationJob,
      UsageEvent,
      IdempotencyKey,
    ]),
    PostsModule,
    QueueModule,
    AuthModule,
  ],
  controllers: [ApiController, PublicApiController],
  providers: [ApiService],
  exports: [ApiService],
})
export class ApiModule {}

