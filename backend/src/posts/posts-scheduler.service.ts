import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PostsService } from './posts.service';

@Injectable()
export class PostsSchedulerService {
  private readonly logger = new Logger(PostsSchedulerService.name);

  constructor(private readonly postsService: PostsService) {}

  /**
   * Every minute: find and publish posts whose scheduledAt has passed.
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async publishDuePosts(): Promise<void> {
    try {
      await this.postsService.publishScheduledPosts();
    } catch (err) {
      this.logger.error(`Scheduled publish cron failed: ${err.message}`, err.stack);
    }
  }
}
