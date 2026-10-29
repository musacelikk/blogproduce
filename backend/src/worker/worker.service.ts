import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import {
  SQSClient,
  ReceiveMessageCommand,
  DeleteMessageCommand,
  Message,
} from '@aws-sdk/client-sqs';
import { Post, PostStatus } from '../entities/post.entity';
import { PostRevision, ContentFormat, ContentEditor } from '../entities/post-revision.entity';
import { PostSeo } from '../entities/post-seo.entity';
import { GenerationJob, JobStatus } from '../entities/generation-job.entity';
import { SqsService, GeneratePostMessage, PublishPostMessage } from '../queue/sqs.service';
import { UsageService } from '../usage/usage.service';
import { BlogGeneratorService, BlogGenerationResult } from '../ai/blog-generator.service';
import { BillingService } from '../billing/billing.service';
import { LlmRefusalError } from '../ai/llm.service';

@Injectable()
export class WorkerService {
  private readonly logger = new Logger(WorkerService.name);
  private sqsClient: SQSClient;
  private generatePostQueueUrl: string;
  private generatePostDlqUrl: string;
  private publishPostQueueUrl: string;
  private publishPostDlqUrl: string;
  private isProcessing = false;

  // Concurrency control
  private readonly maxConcurrency: number;
  private activeJobs = new Set<string>(); // Track active job IDs
  private readonly jobTimeoutMs: number; // Max time per job (default: 5 minutes)
  private readonly maxReceiveCount: number; // SQS deliveries before giving up

  constructor(
    private configService: ConfigService,
    @InjectRepository(Post)
    private postsRepository: Repository<Post>,
    @InjectRepository(PostRevision)
    private postRevisionsRepository: Repository<PostRevision>,
    @InjectRepository(PostSeo)
    private postSeoRepository: Repository<PostSeo>,
    @InjectRepository(GenerationJob)
    private generationJobRepository: Repository<GenerationJob>,
    private dataSource: DataSource,
    private sqsService: SqsService,
    private usageService: UsageService,
    private billingService: BillingService,
    private blogGenerator: BlogGeneratorService,
  ) {
    // Get region from config or parse from queue URL
    let region = this.configService.get<string>('AWS_REGION');
    const generatePostQueueUrl =
      this.configService.get<string>('SQS_GENERATE_POST_QUEUE_URL') || '';

    // If region not set, try to parse from queue URL
    if (!region && generatePostQueueUrl) {
      try {
        const url = new URL(generatePostQueueUrl);
        // Extract region from URL: https://sqs.eu-central-1.amazonaws.com/...
        const hostnameParts = url.hostname.split('.');
        if (hostnameParts.length >= 2 && hostnameParts[0] === 'sqs') {
          region = hostnameParts[1]; // eu-central-1, us-east-1, etc.
        }
      } catch (e) {
        // Ignore parse errors
      }
    }

    region = region || 'us-east-1';

    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>('AWS_SECRET_ACCESS_KEY');

    if (!accessKeyId || !secretAccessKey) {
      this.logger.warn('AWS credentials not configured. SQS operations will fail.');
      this.logger.warn('Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in .env file');
    }

    this.sqsClient = new SQSClient({
      region,
      ...(accessKeyId && secretAccessKey
        ? {
            credentials: {
              accessKeyId,
              secretAccessKey,
            },
          }
        : {}),
    });

    this.logger.log(`SQS Client configured with region: ${region}`);
    if (accessKeyId && secretAccessKey) {
      this.logger.log(
        `AWS credentials configured (Access Key ID: ${accessKeyId.substring(0, 4)}...)`,
      );
    }

    this.generatePostQueueUrl = this.configService.get<string>('SQS_GENERATE_POST_QUEUE_URL') || '';
    this.generatePostDlqUrl = this.configService.get<string>('SQS_GENERATE_POST_DLQ_URL') || '';
    this.publishPostQueueUrl = this.configService.get<string>('SQS_PUBLISH_POST_QUEUE_URL') || '';
    this.publishPostDlqUrl = this.configService.get<string>('SQS_PUBLISH_POST_DLQ_URL') || '';

    // Concurrency and timeout configuration
    this.maxConcurrency = parseInt(
      this.configService.get<string>('WORKER_MAX_CONCURRENCY') || '3',
      10,
    );
    this.jobTimeoutMs = parseInt(
      this.configService.get<string>('WORKER_JOB_TIMEOUT_MS') || '300000',
      10,
    ); // 5 minutes default
    this.maxReceiveCount = parseInt(
      this.configService.get<string>('WORKER_MAX_RECEIVE_COUNT') || '3',
      10,
    );

    this.logger.log(
      `Worker configured: maxConcurrency=${this.maxConcurrency}, jobTimeoutMs=${this.jobTimeoutMs}`,
    );

    // Log configuration
    if (this.generatePostQueueUrl) {
      this.logger.log(`Generate post queue configured: ${this.generatePostQueueUrl}`);
    }
    if (this.generatePostDlqUrl) {
      this.logger.log(`Generate post DLQ configured: ${this.generatePostDlqUrl}`);
    }
    if (this.publishPostQueueUrl) {
      this.logger.log(`Publish post queue configured: ${this.publishPostQueueUrl}`);
    }
    if (this.publishPostDlqUrl) {
      this.logger.log(`Publish post DLQ configured: ${this.publishPostDlqUrl}`);
    }
  }

  async start() {
    if (this.isProcessing) {
      this.logger.warn('Worker is already processing');
      return;
    }

    this.isProcessing = true;
    this.logger.log('Worker started');

    // Start polling for GENERATE_POST messages
    this.pollGeneratePostQueue();
  }

  async stop() {
    this.isProcessing = false;
    this.logger.log('Worker stopped');
  }

  private async pollGeneratePostQueue() {
    while (this.isProcessing) {
      try {
        if (!this.generatePostQueueUrl) {
          this.logger.warn('SQS_GENERATE_POST_QUEUE_URL not configured, skipping queue poll');
          await this.sleep(5000);
          continue;
        }

        const command = new ReceiveMessageCommand({
          QueueUrl: this.generatePostQueueUrl,
          MaxNumberOfMessages: 1,
          WaitTimeSeconds: 20,
          MessageAttributeNames: ['All'],
          // ApproximateReceiveCount drives our retry accounting
          MessageSystemAttributeNames: ['ApproximateReceiveCount'],
        });

        const response = await this.sqsClient.send(command);

        if (response.Messages && response.Messages.length > 0) {
          for (const message of response.Messages) {
            // Check concurrency limit
            if (this.activeJobs.size >= this.maxConcurrency) {
              this.logger.warn(
                `Max concurrency (${this.maxConcurrency}) reached, skipping message`,
              );
              // Don't delete message, let it become visible again for retry
              continue;
            }

            const jobKey = message.MessageId || `msg-${Date.now()}`;
            this.activeJobs.add(jobKey);

            // Process message asynchronously (don't await to allow concurrent processing)
            this.processGeneratePostMessage(message)
              .catch((error) => {
                this.logger.error(`Error processing message: ${error.message}`, error.stack);
              })
              .finally(() => {
                this.activeJobs.delete(jobKey);
              });
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);

        // Check for specific AWS credential errors
        if (
          errorMessage.includes('security token') ||
          errorMessage.includes('InvalidClientTokenId')
        ) {
          this.logger.error('AWS credentials are invalid or expired.');
          this.logger.error(
            'Please check your AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in .env file',
          );
          this.logger.error('Make sure the credentials have SQS permissions for the queue');
        } else if (errorMessage.includes('region')) {
          this.logger.error('AWS region mismatch. Check AWS_REGION or queue URL region.');
        } else {
          this.logger.error(
            `Error polling queue: ${errorMessage}`,
            error instanceof Error ? error.stack : undefined,
          );
        }

        await this.sleep(5000);
      }
    }
  }

  private async processGeneratePostMessage(message: Message) {
    const receiptHandle = message.ReceiptHandle;
    if (!receiptHandle) {
      this.logger.error('Message receipt handle is missing');
      return;
    }

    const startTime = Date.now();

    try {
      const body = JSON.parse(message.Body || '{}') as GeneratePostMessage;
      this.logger.log(`Processing generate post message for postId: ${body.postId}`);

      // Get post to find userId
      const post = await this.postsRepository.findOne({
        where: { id: body.postId },
        relations: ['author'],
      });

      if (!post || !post.authorId) {
        throw new Error(`Post not found or missing author: ${body.postId}`);
      }

      // Plan, tier permission and token balance are all checked here. Returns the
      // tier the job actually runs on (the plan default when none was requested).
      const tier = await this.billingService.authorizeGeneration(post.authorId, body.model);

      // Atomically claim the post. This both moves it to GENERATING and acts as the
      // idempotency lock: a concurrent delivery of the same message loses the race.
      const claimed = await this.claimPost(body.postId);
      if (!claimed) {
        this.logger.warn(
          `Post ${body.postId} is already being generated, skipping duplicate delivery`,
        );
        await this.deleteMessage(this.generatePostQueueUrl, receiptHandle);
        return;
      }

      // Update generation job status to PROCESSING
      if (body.jobId) {
        await this.updateGenerationJob(body.jobId, JobStatus.PROCESSING, null, 0);
      }

      // Generate content via the multi-stage AI pipeline (outline → draft → polish)
      const result = await this.blogGenerator.generate({
        topic: body.topic,
        language: body.language,
        tone: body.tone,
        length: body.length,
        targetAudience: body.targetAudience,
        additionalContext: body.additionalContext,
        seoMode: body.seoMode,
        keywords: body.keywords,
        outline: body.outline,
        relatedPosts: await this.findRelatedPosts(post),
        modelOrTier: tier,
        onStage: body.jobId
          ? (stage) => this.recordJobStage(body.jobId as string, stage)
          : undefined,
      });

      // Record usage per pipeline stage (stages may run on different models)
      for (const stage of result.stages) {
        await this.usageService.recordUsage(
          post.authorId,
          stage.model,
          stage.tokensIn,
          stage.tokensOut,
        );
      }

      // Anything spent past the monthly allowance comes out of purchased tokens.
      await this.billingService.settleTokenBalance(
        post.authorId,
        result.tokensIn + result.tokensOut,
      );

      await this.saveGenerationResult(body.postId, result);

      // Update post status to DRAFT (not PUBLISHED - client will publish later)
      await this.updatePostStatus(body.postId, PostStatus.DRAFT, null);

      // Update generation job status to COMPLETED
      if (body.jobId) {
        const processingTime = Date.now() - startTime;
        await this.updateGenerationJob(body.jobId, JobStatus.COMPLETED, null, processingTime);
      }

      // Delete message from queue
      await this.deleteMessage(this.generatePostQueueUrl, receiptHandle);

      this.logger.log(`Successfully processed postId: ${body.postId}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Error processing message: ${errorMessage}`,
        error instanceof Error ? error.stack : undefined,
      );

      let body: GeneratePostMessage | null = null;
      try {
        body = JSON.parse(message.Body || '{}') as GeneratePostMessage;
      } catch {
        // Unparseable body can never succeed — drop it rather than looping forever.
        this.logger.error('Message body is not valid JSON, deleting');
        await this.deleteMessage(this.generatePostQueueUrl, receiptHandle);
        return;
      }

      // SQS tracks delivery attempts for us; retrying is simply "do not delete".
      const receiveCount = parseInt(message.Attributes?.ApproximateReceiveCount || '1', 10);
      const { message: finalErrorMessage, retryable } = this.classifyError(error, errorMessage);
      const exhausted = receiveCount >= this.maxReceiveCount;

      if (retryable && !exhausted) {
        // Release the claim so the redelivered message can pick the post back up,
        // and leave the message on the queue for SQS to redeliver.
        this.logger.warn(
          `Transient failure for post ${body.postId} (attempt ${receiveCount}/${this.maxReceiveCount}), leaving message for redelivery`,
        );
        await this.updatePostStatus(body.postId, PostStatus.QUEUED, finalErrorMessage);
        if (body.jobId) {
          await this.updateGenerationJob(
            body.jobId,
            JobStatus.PENDING,
            finalErrorMessage,
            Date.now() - startTime,
          );
        }
        return;
      }

      // Permanent failure (or retries exhausted): record it and stop retrying.
      try {
        if (retryable && exhausted) {
          this.logger.warn(`Job exceeded max receives (${this.maxReceiveCount}), sending to DLQ`);
          try {
            await this.sqsService.sendToGeneratePostDlq(
              { ...body, retryCount: receiveCount },
              errorMessage,
            );
          } catch (dlqError) {
            this.logger.error(`Failed to send to DLQ: ${dlqError.message}`);
          }
        }

        await this.updatePostStatus(body.postId, PostStatus.FAILED, finalErrorMessage);

        if (body.jobId) {
          await this.updateGenerationJob(
            body.jobId,
            JobStatus.FAILED,
            finalErrorMessage,
            Date.now() - startTime,
          );
        }
      } catch (e) {
        this.logger.error(`Failed to update post status: ${e.message}`);
      }

      await this.deleteMessage(this.generatePostQueueUrl, receiptHandle);
    }
  }

  /**
   * Map a thrown error to a user-facing message and decide whether retrying can help.
   * Quota/rate-limit/network errors are transient; refusals and bad input are not.
   */
  private classifyError(
    error: unknown,
    errorMessage: string,
  ): { message: string; retryable: boolean } {
    if (error instanceof LlmRefusalError) {
      return {
        message:
          'İçerik, yapay zekâ sağlayıcısının güvenlik filtrelerine takıldı. Lütfen konuyu farklı bir şekilde ifade edip tekrar deneyin.',
        retryable: false,
      };
    }

    if (
      error instanceof ForbiddenException ||
      /aylık kullanım limiti|token bakiyeniz|deneme süreniz|aboneliğinizin süresi/i.test(
        errorMessage,
      )
    ) {
      return {
        message: errorMessage,
        retryable: false,
      };
    }

    if (/quota/i.test(errorMessage)) {
      return {
        message:
          'AI sağlayıcısının API kotası aşıldı. Lütfen hesap limitlerini kontrol edin veya daha sonra tekrar deneyin.',
        retryable: true,
      };
    }

    if (/rate limit/i.test(errorMessage) || errorMessage.includes('429')) {
      return {
        message:
          'AI sağlayıcısında rate limit aşıldı. Lütfen birkaç dakika bekleyip tekrar deneyin.',
        retryable: true,
      };
    }

    if (/ETIMEDOUT|ECONNRESET|ENOTFOUND|socket hang up|timeout/i.test(errorMessage)) {
      return {
        message: 'AI sağlayıcısına geçici olarak ulaşılamadı. Yeniden deneniyor.',
        retryable: true,
      };
    }

    if (/invalid/i.test(errorMessage)) {
      return { message: `Geçersiz istek: ${errorMessage}`, retryable: false };
    }

    return { message: errorMessage, retryable: false };
  }

  /**
   * Atomically move a post into GENERATING. Returns false when another worker already
   * owns it. A GENERATING post whose lease has expired (crashed worker) is reclaimable.
   */
  private async claimPost(postId: string): Promise<boolean> {
    const staleBefore = new Date(Date.now() - this.jobTimeoutMs);

    const result = await this.postsRepository
      .createQueryBuilder()
      .update(Post)
      .set({ status: PostStatus.GENERATING, lastError: null })
      .where('id = :postId', { postId })
      // "updatedAt" is quoted because the column is camelCase in the database
      // (Post maps only some columns to snake_case).
      .andWhere('(status != :generating OR "updatedAt" < :staleBefore)', {
        generating: PostStatus.GENERATING,
        staleBefore,
      })
      .execute();

    return (result.affected ?? 0) > 0;
  }

  private async updatePostStatus(postId: string, status: PostStatus, error: string | null) {
    await this.postsRepository.update(postId, {
      status,
      lastError: error,
    });
  }

  /**
   * Published articles on the same site, for the writer to link to.
   *
   * Resolved here rather than passed through the SQS message so that every
   * generation path gets internal links without widening the message contract —
   * and so in-flight messages from an older deploy keep working.
   *
   * Scoped to `workspaceId` because that is the site boundary the dashboard
   * uses; a post with no workspace (older API rows, see migration 003) simply
   * gets no links rather than borrowing another tenant's.
   */
  private async findRelatedPosts(post: Post): Promise<Array<{ title: string; slug: string }>> {
    if (!post.workspaceId) return [];

    try {
      const published = await this.postsRepository.find({
        where: {
          workspaceId: post.workspaceId,
          status: PostStatus.PUBLISHED,
        },
        select: ['id', 'title', 'slug'],
        order: { publishedAt: 'DESC' },
        take: 8,
      });

      return published
        .filter((p) => p.id !== post.id && p.slug && p.title)
        .map((p) => ({ title: p.title, slug: p.slug }));
    } catch (err) {
      // Links are an enhancement; losing them must not cost us the article.
      this.logger.warn(`İlgili yazılar getirilemedi: ${(err as Error).message}`);
      return [];
    }
  }

  /**
   * Record which pipeline stage a job is on, for the client's progress display.
   *
   * Deliberately a bare UPDATE with no read: it is advisory, fires up to three
   * times per job, and the generator already swallows any failure here.
   */
  private async recordJobStage(jobId: string, stage: string): Promise<void> {
    await this.generationJobRepository.update(jobId, { stage });
  }

  private async updateGenerationJob(
    jobId: string,
    status: JobStatus,
    error: string | null,
    processingTimeMs: number,
  ) {
    const updateData: any = {
      status,
      error,
      processingTimeMs,
    };

    if (status === JobStatus.PROCESSING) {
      updateData.startedAt = new Date();
    } else if (status === JobStatus.COMPLETED || status === JobStatus.FAILED) {
      updateData.completedAt = new Date();
      // A terminal job must not keep advertising the stage it died on.
      updateData.stage = null;
    }

    await this.generationJobRepository.update(jobId, updateData);
  }

  /** Persist the generation result: revision + post title/excerpt + SEO metadata. */
  private async saveGenerationResult(postId: string, result: BlogGenerationResult): Promise<void> {
    const latestRevision = await this.postRevisionsRepository.findOne({
      where: { postId },
      order: { version: 'DESC' },
    });
    const nextVersion = latestRevision ? latestRevision.version + 1 : 1;

    const revision = this.postRevisionsRepository.create({
      postId,
      version: nextVersion,
      editor: ContentEditor.AI,
      contentFormat: ContentFormat.JSON,
      content: result.canonicalJson,
      model: result.model,
      instructions: result.systemPrompt,
      inputPrompt: result.userPrompt,
      tokensIn: result.tokensIn,
      tokensOut: result.tokensOut,
      latencyMs: result.latencyMs,
      provider: result.provider,
      responseId: result.responseId,
    });
    await this.postRevisionsRepository.save(revision);

    // Reflect the generated title/excerpt on the post itself
    const postUpdates: Record<string, any> = {};
    if (result.blog.title) postUpdates.title = result.blog.title;
    if (result.blog.excerpt) postUpdates.excerpt = result.blog.excerpt;
    if (Object.keys(postUpdates).length > 0) {
      await this.postsRepository.update(postId, postUpdates);
    }

    // Upsert SEO metadata so integrators receive real meta tags + JSON-LD
    const seo = result.blog.metadata.seo;
    if (seo.metaTitle || seo.metaDescription || result.blog.metadata.faq.length > 0) {
      let postSeo = await this.postSeoRepository.findOne({ where: { postId } });
      if (!postSeo) {
        postSeo = this.postSeoRepository.create({ postId });
      }
      postSeo.metaTitle = seo.metaTitle || result.blog.title;
      postSeo.metaDescription = seo.metaDescription || result.blog.excerpt;
      postSeo.ogTitle = seo.ogTitle || postSeo.metaTitle;
      postSeo.ogDescription = seo.ogDescription || postSeo.metaDescription;
      postSeo.schemaJsonld = this.buildSchemaJsonld(result);
      await this.postSeoRepository.save(postSeo);
    }
  }

  private buildSchemaJsonld(result: BlogGenerationResult): Record<string, any> {
    const now = new Date().toISOString();
    const article: Record<string, any> = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: result.blog.title,
      description: result.blog.metadata.seo.metaDescription || result.blog.excerpt,
      datePublished: now,
      dateModified: now,
    };
    if (result.blog.metadata.seo.keywords.length > 0) {
      article.keywords = result.blog.metadata.seo.keywords.join(', ');
    }

    if (result.blog.metadata.faq.length > 0) {
      return {
        '@context': 'https://schema.org',
        '@graph': [
          article,
          {
            '@type': 'FAQPage',
            mainEntity: result.blog.metadata.faq.map((item) => ({
              '@type': 'Question',
              name: item.question,
              acceptedAnswer: { '@type': 'Answer', text: item.answer },
            })),
          },
        ],
      };
    }
    return article;
  }

  private async deleteMessage(queueUrl: string, receiptHandle: string) {
    try {
      const command = new DeleteMessageCommand({
        QueueUrl: queueUrl,
        ReceiptHandle: receiptHandle,
      });
      await this.sqsClient.send(command);
    } catch (error) {
      this.logger.error(`Failed to delete message: ${error.message}`);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
