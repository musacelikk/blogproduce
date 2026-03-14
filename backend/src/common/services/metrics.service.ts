import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { Post, PostStatus } from '../../entities/post.entity';
import { UsageLedger } from '../../entities/usage-ledger.entity';
import { GenerationJob } from '../../entities/generation-job.entity';
import { SqsService } from '../../queue/sqs.service';

export interface Metrics {
  generateSuccessRate: number; // Percentage
  avgGenerationTime: number; // Milliseconds
  avgTokensPerJob: number;
  queueDepth: number;
  dlqCount: number;
  totalJobs: number;
  successfulJobs: number;
  failedJobs: number;
}

@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name);

  constructor(
    @InjectRepository(Post)
    private postRepository: Repository<Post>,
    @InjectRepository(UsageLedger)
    private usageLedgerRepository: Repository<UsageLedger>,
    @InjectRepository(GenerationJob)
    private generationJobRepository: Repository<GenerationJob>,
    private sqsService: SqsService,
  ) {}

  /**
   * Get all metrics
   */
  async getMetrics(organizationId?: string, projectId?: string): Promise<Metrics> {
    const [generateSuccessRate, avgGenerationTime, avgTokensPerJob, queueDepth, dlqCount] = await Promise.all([
      this.calculateSuccessRate(organizationId, projectId),
      this.calculateAvgGenerationTime(organizationId, projectId),
      this.calculateAvgTokensPerJob(organizationId, projectId),
      this.getQueueDepth(),
      this.getDlqCount(),
    ]);

    const [totalJobs, successfulJobs, failedJobs] = await this.getJobCounts(organizationId, projectId);

    return {
      generateSuccessRate,
      avgGenerationTime,
      avgTokensPerJob,
      queueDepth,
      dlqCount,
      totalJobs,
      successfulJobs,
      failedJobs,
    };
  }

  /**
   * Calculate success rate (last 24 hours)
   */
  private async calculateSuccessRate(organizationId?: string, projectId?: string): Promise<number> {
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const where: any = {
      createdAt: MoreThan(last24Hours),
    };

    if (organizationId) {
      where.organizationId = organizationId;
    }
    if (projectId) {
      where.projectId = projectId;
    }

    const [total, successful] = await Promise.all([
      this.postRepository.count({ where }),
      this.postRepository.count({
        where: { ...where, status: PostStatus.GENERATED },
      }),
    ]);

    if (total === 0) {
      return 0;
    }

    return Math.round((successful / total) * 100 * 100) / 100; // 2 decimal places
  }

  /**
   * Calculate average generation time (last 24 hours)
   */
  private async calculateAvgGenerationTime(organizationId?: string, projectId?: string): Promise<number> {
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const where: any = {
      createdAt: MoreThan(last24Hours),
      status: PostStatus.GENERATED,
    };

    if (organizationId) {
      where.organizationId = organizationId;
    }
    if (projectId) {
      where.projectId = projectId;
    }

    // Get posts with revisions to calculate generation time
    const posts = await this.postRepository.find({
      where,
      relations: ['revisions'],
      take: 100, // Sample size
    });

    if (posts.length === 0) {
      return 0;
    }

    let totalTime = 0;
    let count = 0;

    for (const post of posts) {
      if (post.revisions && post.revisions.length > 0) {
        const firstRevision = post.revisions[0];
        const lastRevision = post.revisions[post.revisions.length - 1];
        
        if (firstRevision.createdAt && lastRevision.createdAt) {
          const timeDiff = lastRevision.createdAt.getTime() - firstRevision.createdAt.getTime();
          totalTime += timeDiff;
          count++;
        }
      }
    }

    return count > 0 ? Math.round(totalTime / count) : 0;
  }

  /**
   * Calculate average tokens per job (last 24 hours)
   */
  private async calculateAvgTokensPerJob(organizationId?: string, projectId?: string): Promise<number> {
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const where: any = {
      createdAt: MoreThan(last24Hours),
    };

    if (organizationId) {
      where.organizationId = organizationId;
    }
    if (projectId) {
      where.projectId = projectId;
    }

    const usageRecords = await this.usageLedgerRepository.find({
      where,
      take: 100, // Sample size
    });

    if (usageRecords.length === 0) {
      return 0;
    }

    const totalTokens = usageRecords.reduce((sum, record) => {
      return sum + (record.tokensIn || 0) + (record.tokensOut || 0);
    }, 0);

    return Math.round(totalTokens / usageRecords.length);
  }

  /**
   * Get queue depth (approximate)
   */
  private async getQueueDepth(): Promise<number> {
    try {
      // Count posts in QUEUED or GENERATING status
      const count = await this.postRepository.count({
        where: [
          { status: PostStatus.QUEUED },
          { status: PostStatus.GENERATING },
        ],
      });
      return count;
    } catch (error) {
      this.logger.error('Failed to get queue depth', error);
      return 0;
    }
  }

  /**
   * Get DLQ count (approximate)
   */
  private async getDlqCount(): Promise<number> {
    try {
      // Count posts in FAILED status (last 7 days)
      const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const count = await this.postRepository.count({
        where: {
          status: PostStatus.FAILED,
          createdAt: MoreThan(last7Days),
        },
      });
      return count;
    } catch (error) {
      this.logger.error('Failed to get DLQ count', error);
      return 0;
    }
  }

  /**
   * Get job counts
   */
  private async getJobCounts(organizationId?: string, projectId?: string): Promise<[number, number, number]> {
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const where: any = {
      createdAt: MoreThan(last24Hours),
    };

    if (organizationId) {
      where.organizationId = organizationId;
    }
    if (projectId) {
      where.projectId = projectId;
    }

    const [total, successful, failed] = await Promise.all([
      this.postRepository.count({ where }),
      this.postRepository.count({ where: { ...where, status: PostStatus.GENERATED } }),
      this.postRepository.count({ where: { ...where, status: PostStatus.FAILED } }),
    ]);

    return [total, successful, failed];
  }
}

