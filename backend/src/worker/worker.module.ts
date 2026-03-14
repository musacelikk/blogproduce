import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkerService } from './worker.service';
import { Post } from '../entities/post.entity';
import { PostRevision } from '../entities/post-revision.entity';
import { GenerationJob } from '../entities/generation-job.entity';
import { QueueModule } from '../queue/queue.module';
import { UsageModule } from '../usage/usage.module';

@Module({
  imports: [TypeOrmModule.forFeature([Post, PostRevision, GenerationJob]), QueueModule, UsageModule],
  providers: [WorkerService],
  exports: [WorkerService],
})
export class WorkerModule {}

