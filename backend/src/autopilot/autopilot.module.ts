import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { AutopilotService } from './autopilot.service';
import { AutopilotController } from './autopilot.controller';
import { AutopilotSchedulerService } from './autopilot.scheduler';
import { TopicPlannerService } from './topic-planner.service';
import { AutopilotConfig } from '../entities/autopilot-config.entity';
import { TopicIdea } from '../entities/topic-idea.entity';
import { Post } from '../entities/post.entity';
import { Site } from '../entities/site.entity';
import { User } from '../entities/user.entity';
import { Workspace } from '../entities/workspace.entity';
import { PostsModule } from '../posts/posts.module';
import { AiModule } from '../ai/ai.module';
import { UsageModule } from '../usage/usage.module';
import { UnsplashModule } from '../unsplash/unsplash.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AutopilotConfig, TopicIdea, Post, Site, User, Workspace]),
    // Registered here as well as in PostsModule: autopilot's crons are its own,
    // and should not stop firing if that import ever moves.
    ScheduleModule.forRoot(),
    // Generation is enqueued through PostsService so autopilot goes through the
    // exact same billing gate, slug uniquing and workspace→org/project bridge
    // as a dashboard request. No second generation path.
    PostsModule,
    AiModule,
    UsageModule,
    // Cover images, searched with the planner's primaryKeyword — no model call.
    UnsplashModule,
  ],
  controllers: [AutopilotController],
  providers: [AutopilotService, TopicPlannerService, AutopilotSchedulerService],
  exports: [AutopilotService],
})
export class AutopilotModule {}
