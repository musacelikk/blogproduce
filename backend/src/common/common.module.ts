import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HtmlSanitizerService } from './services/html-sanitizer.service';
import { SentryService } from './services/sentry.service';
import { MetricsService } from './services/metrics.service';
import { Post } from '../entities/post.entity';
import { UsageLedger } from '../entities/usage-ledger.entity';
import { GenerationJob } from '../entities/generation-job.entity';
import { QueueModule } from '../queue/queue.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Post, UsageLedger, GenerationJob]),
    QueueModule,
  ],
  providers: [HtmlSanitizerService, SentryService, MetricsService],
  exports: [HtmlSanitizerService, SentryService, MetricsService],
})
export class CommonModule {}

