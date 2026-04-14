import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { SQSClient, ReceiveMessageCommand, DeleteMessageCommand, Message } from '@aws-sdk/client-sqs';
import OpenAI from 'openai';
import { Post, PostStatus } from '../entities/post.entity';
import { PostRevision, ContentFormat, ContentEditor } from '../entities/post-revision.entity';
import { GenerationJob, JobStatus } from '../entities/generation-job.entity';
import { SqsService, GeneratePostMessage, PublishPostMessage } from '../queue/sqs.service';
import { UsageService } from '../usage/usage.service';
import { markdownToJson } from '../common/utils/content-format.util';

@Injectable()
export class WorkerService {
  private readonly logger = new Logger(WorkerService.name);
  private sqsClient: SQSClient;
  private openai: OpenAI;
  private generatePostQueueUrl: string;
  private generatePostDlqUrl: string;
  private publishPostQueueUrl: string;
  private publishPostDlqUrl: string;
  private isProcessing = false;
  
  // Concurrency control
  private readonly maxConcurrency: number;
  private activeJobs = new Set<string>(); // Track active job IDs
  private readonly jobTimeoutMs: number; // Max time per job (default: 5 minutes)
  private readonly processedJobIds = new Set<string>(); // Idempotency: track processed job IDs

  constructor(
    private configService: ConfigService,
    @InjectRepository(Post)
    private postsRepository: Repository<Post>,
    @InjectRepository(PostRevision)
    private postRevisionsRepository: Repository<PostRevision>,
    @InjectRepository(GenerationJob)
    private generationJobRepository: Repository<GenerationJob>,
    private dataSource: DataSource,
    private sqsService: SqsService,
    private usageService: UsageService,
  ) {
    // Get region from config or parse from queue URL
    let region = this.configService.get<string>('AWS_REGION');
    const generatePostQueueUrl = this.configService.get<string>('SQS_GENERATE_POST_QUEUE_URL') || '';
    
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
      this.logger.log(`AWS credentials configured (Access Key ID: ${accessKeyId.substring(0, 4)}...)`);
    }

    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      this.logger.warn('OPENAI_API_KEY not configured');
    } else {
      this.openai = new OpenAI({ apiKey });
    }

    this.generatePostQueueUrl = this.configService.get<string>('SQS_GENERATE_POST_QUEUE_URL') || '';
    this.generatePostDlqUrl = this.configService.get<string>('SQS_GENERATE_POST_DLQ_URL') || '';
    this.publishPostQueueUrl = this.configService.get<string>('SQS_PUBLISH_POST_QUEUE_URL') || '';
    this.publishPostDlqUrl = this.configService.get<string>('SQS_PUBLISH_POST_DLQ_URL') || '';
    
    // Concurrency and timeout configuration
    this.maxConcurrency = parseInt(this.configService.get<string>('WORKER_MAX_CONCURRENCY') || '3', 10);
    this.jobTimeoutMs = parseInt(this.configService.get<string>('WORKER_JOB_TIMEOUT_MS') || '300000', 10); // 5 minutes default
    
    this.logger.log(`Worker configured: maxConcurrency=${this.maxConcurrency}, jobTimeoutMs=${this.jobTimeoutMs}`);

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
        });

        const response = await this.sqsClient.send(command);

        if (response.Messages && response.Messages.length > 0) {
          for (const message of response.Messages) {
            // Check concurrency limit
            if (this.activeJobs.size >= this.maxConcurrency) {
              this.logger.warn(`Max concurrency (${this.maxConcurrency}) reached, skipping message`);
              // Don't delete message, let it become visible again for retry
              continue;
            }

            // Process message asynchronously (don't await to allow concurrent processing)
            this.processGeneratePostMessage(message).catch((error) => {
              this.logger.error(`Error processing message: ${error.message}`, error.stack);
            });
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        // Check for specific AWS credential errors
        if (errorMessage.includes('security token') || errorMessage.includes('InvalidClientTokenId')) {
          this.logger.error('AWS credentials are invalid or expired.');
          this.logger.error('Please check your AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in .env file');
          this.logger.error('Make sure the credentials have SQS permissions for the queue');
        } else if (errorMessage.includes('region')) {
          this.logger.error('AWS region mismatch. Check AWS_REGION or queue URL region.');
        } else {
          this.logger.error(`Error polling queue: ${errorMessage}`, error instanceof Error ? error.stack : undefined);
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

      // Acquire lock (idempotency check)
      const lockAcquired = await this.acquireLock(body.postId);
      if (!lockAcquired) {
        this.logger.warn(`Lock already acquired for postId: ${body.postId}, skipping`);
        await this.deleteMessage(this.generatePostQueueUrl, receiptHandle);
        return;
      }

      // Get post to find userId
      const post = await this.postsRepository.findOne({
        where: { id: body.postId },
        relations: ['author'],
      });

      if (!post || !post.authorId) {
        throw new Error(`Post not found or missing author: ${body.postId}`);
      }

      // Check monthly usage limit before generating
      await this.usageService.checkMonthlyLimit(post.authorId);

      // Update status to generating
      await this.updatePostStatus(body.postId, PostStatus.GENERATING, null);

      // Update generation job status to PROCESSING
      if (body.jobId) {
        await this.updateGenerationJob(body.jobId, JobStatus.PROCESSING, null, 0);
      }

      // Generate content with OpenAI
      const result = await this.generateContent(body);

      // Record usage after successful generation
      await this.usageService.recordUsage(
        post.authorId,
        result.model,
        result.tokensIn,
        result.tokensOut,
      );

      // Get latest version
      const latestRevision = await this.postRevisionsRepository.findOne({
        where: { postId: body.postId },
        order: { version: 'DESC' },
      });
      const nextVersion = latestRevision ? latestRevision.version + 1 : 1;

      // Always store content as JSON format
      // Convert markdown/html to JSON if needed
      let jsonContent: string;
      let contentFormat: ContentFormat = ContentFormat.JSON;
      
      try {
        // Try to parse as JSON first
        JSON.parse(result.content);
        jsonContent = result.content; // Already JSON
      } catch {
        // Not JSON, convert to JSON format
        const json = markdownToJson(result.content);
        jsonContent = JSON.stringify(json);
      }

      // Save revision
      const revision = this.postRevisionsRepository.create({
        postId: body.postId,
        version: nextVersion,
        editor: ContentEditor.AI,
        contentFormat: contentFormat,
        content: jsonContent,
        model: result.model,
        instructions: result.instructions,
        inputPrompt: result.inputPrompt,
        tokensIn: result.tokensIn,
        tokensOut: result.tokensOut,
        latencyMs: result.latencyMs,
        provider: 'openai',
        responseId: result.responseId,
      });

      await this.postRevisionsRepository.save(revision);

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
      this.logger.error(`Error processing message: ${errorMessage}`, error instanceof Error ? error.stack : undefined);
      
      // Update post status to failed
      try {
        const body = JSON.parse(message.Body || '{}') as GeneratePostMessage;
        
        // Increment retry count
        const retryCount = (body.retryCount || 0) + 1;
        const maxRetries = 3; // Max retries before DLQ
        
        if (retryCount >= maxRetries) {
          // Send to DLQ after max retries
          this.logger.warn(`Job exceeded max retries (${maxRetries}), sending to DLQ`);
          try {
            await this.sqsService.sendToGeneratePostDlq({
              ...body,
              retryCount,
            }, errorMessage);
          } catch (dlqError) {
            this.logger.error(`Failed to send to DLQ: ${dlqError.message}`);
          }
        }
        
        // Handle specific error types
        let finalErrorMessage = errorMessage;
        
        if (errorMessage.includes('quota') || errorMessage.includes('Quota')) {
          finalErrorMessage = 'OpenAI API quota aşıldı. Lütfen OpenAI hesabınızın limitlerini kontrol edin veya daha sonra tekrar deneyin.';
        } else if (errorMessage.includes('rate limit') || errorMessage.includes('Rate limit')) {
          finalErrorMessage = 'OpenAI API rate limit aşıldı. Lütfen birkaç dakika bekleyip tekrar deneyin.';
        } else if (errorMessage.includes('Monthly usage limit exceeded')) {
          finalErrorMessage = 'Aylık kullanım limiti aşıldı. Lütfen daha sonra tekrar deneyin veya limitinizi artırın.';
          await this.updatePostStatus(body.postId, PostStatus.QUEUED, finalErrorMessage);
          this.logger.warn(`Post ${body.postId} requeued due to usage limit`);
          // Delete message so it can be retried later
          await this.deleteMessage(this.generatePostQueueUrl, receiptHandle);
          return;
        } else if (errorMessage.includes('invalid') || errorMessage.includes('Invalid')) {
          finalErrorMessage = `Geçersiz istek: ${errorMessage}`;
        }
        
        await this.updatePostStatus(body.postId, PostStatus.FAILED, finalErrorMessage);

        // Update generation job status to FAILED
        if (body.jobId) {
          const processingTime = Date.now() - startTime;
          await this.updateGenerationJob(body.jobId, JobStatus.FAILED, finalErrorMessage, processingTime);
        }
      } catch (e) {
        this.logger.error(`Failed to update post status: ${e.message}`);
      }

      // Delete message from queue (will be retried by SQS if visibility timeout expires)
      // After max receives, SQS automatically moves to DLQ
      // Only delete if not sent to DLQ (let SQS handle retry)
      const body = JSON.parse(message.Body || '{}') as GeneratePostMessage;
      const retryCount = (body.retryCount || 0) + 1;
      const maxRetries = 3;
      if (retryCount < maxRetries) {
        await this.deleteMessage(this.generatePostQueueUrl, receiptHandle);
      }
      // If max retries reached, message will be handled by SQS DLQ configuration
    }
  }

  /**
   * Process a single job (extracted from processGeneratePostMessage for timeout handling)
   */
  private async processJob(body: GeneratePostMessage, jobId: string): Promise<void> {
    // Acquire lock (idempotency check for postId)
    const lockAcquired = await this.acquireLock(body.postId);
    if (!lockAcquired) {
      this.logger.warn(`Lock already acquired for postId: ${body.postId}, skipping`);
      return;
    }

    // Get post to find userId
    const post = await this.postsRepository.findOne({
      where: { id: body.postId },
      relations: ['author'],
    });

    if (!post || !post.authorId) {
      throw new Error(`Post not found or missing author: ${body.postId}`);
    }

    // Check monthly usage limit before generating
    await this.usageService.checkMonthlyLimit(post.authorId);

    // Update status to generating
    await this.updatePostStatus(body.postId, PostStatus.GENERATING, null);

    // Generate content with OpenAI
    const result = await this.generateContent(body);

    // Record usage after successful generation
    await this.usageService.recordUsage(
      post.authorId,
      result.model,
      result.tokensIn,
      result.tokensOut,
    );

    // Get latest version
    const latestRevision = await this.postRevisionsRepository.findOne({
      where: { postId: body.postId },
      order: { version: 'DESC' },
    });
    const nextVersion = latestRevision ? latestRevision.version + 1 : 1;

    // Always store content as JSON format
    // Convert markdown/html to JSON if needed
    let jsonContent: string;
    let contentFormat: ContentFormat = ContentFormat.JSON;
    
    try {
      // Try to parse as JSON first
      JSON.parse(result.content);
      jsonContent = result.content; // Already JSON
    } catch {
      // Not JSON, convert to JSON format
      const json = markdownToJson(result.content);
      jsonContent = JSON.stringify(json);
    }

    // Save revision
    const revision = this.postRevisionsRepository.create({
      postId: body.postId,
      version: nextVersion,
      editor: ContentEditor.AI,
      contentFormat: contentFormat,
      content: jsonContent,
      model: result.model,
      instructions: result.instructions,
      inputPrompt: result.inputPrompt,
      tokensIn: result.tokensIn,
      tokensOut: result.tokensOut,
      latencyMs: result.latencyMs,
      provider: 'openai',
      responseId: result.responseId,
    });

    await this.postRevisionsRepository.save(revision);

    // Update status to generated
    await this.updatePostStatus(body.postId, PostStatus.GENERATED, null);

    this.logger.log(`Successfully processed job ${jobId} for postId: ${body.postId}`);
  }

  private async acquireLock(postId: string): Promise<boolean> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Use SELECT FOR UPDATE to acquire lock
      const post = await queryRunner.manager.findOne(Post, {
        where: { id: postId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!post) {
        await queryRunner.rollbackTransaction();
        return false;
      }

      // Check if already processing
      if (post.status === PostStatus.GENERATING) {
        await queryRunner.rollbackTransaction();
        return false;
      }

      await queryRunner.commitTransaction();
      return true;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Error acquiring lock: ${error.message}`);
      return false;
    } finally {
      await queryRunner.release();
    }
  }

  private async updatePostStatus(postId: string, status: PostStatus, error: string | null) {
    await this.postsRepository.update(postId, {
      status,
      lastError: error,
    });
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
    }

    await this.generationJobRepository.update(jobId, updateData);
  }

  private async generateContent(message: GeneratePostMessage) {
    const startTime = Date.now();
    // Build prompt
    const systemInstructions = this.buildSystemInstructions(message);
    const userPrompt = this.buildUserPrompt(message);

    if (!this.openai) {
      throw new Error('OpenAI client not initialized. Check OPENAI_API_KEY configuration.');
    }

    // Map pricing tiers to concrete OpenAI models.
    const model = this.resolveModel(message.model || this.configService.get<string>('OPENAI_MODEL'));
    this.logger.log(`Generating content with model: ${model}`);

    const maxTokens = parseInt(this.configService.get<string>('OPENAI_MAX_TOKENS') || '4000', 10);
    const temperature = parseFloat(this.configService.get<string>('OPENAI_TEMPERATURE') || '0.7');
    
    let response;
    try {
      response = await this.openai.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemInstructions },
          { role: 'user', content: userPrompt },
        ],
        temperature,
        max_tokens: maxTokens,
        // ✅ Force strict JSON output using JSON schema
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'blog_content',
            strict: true,
            schema: {
              type: 'object',
              properties: {
                content: {
                  type: 'string',
                  description: 'Primary blog content in Markdown format',
                },
                metadata: {
                  type: 'object',
                  description: 'Structured metadata used by the platform',
                  properties: {
                    blocks: {
                      type: 'array',
                      description: 'Optional rich blocks representation of the content',
                      items: {
                        type: 'object',
                        properties: {
                          type: { type: 'string' },
                          level: { type: 'number' },
                          content: { type: 'string' },
                          language: { type: 'string' },
                          ordered: { type: 'boolean' },
                          items: {
                            type: 'array',
                            items: { type: 'string' },
                          },
                          url: { type: 'string' },
                          alt: { type: 'string' },
                          text: { type: 'string' },
                        },
                        required: ['type', 'level', 'content', 'language', 'ordered', 'items', 'url', 'alt', 'text'],
                        additionalProperties: false,
                      },
                    },
                    toc: {
                      type: 'array',
                      description: 'Table of contents generated from headings',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          title: { type: 'string' },
                          level: { type: 'number' },
                        },
                        required: ['id', 'title', 'level'],
                        additionalProperties: false,
                      },
                    },
                    faq: {
                      type: 'array',
                      description: 'Frequently asked questions related to the blog post',
                      items: {
                        type: 'object',
                        properties: {
                          question: { type: 'string' },
                          answer: { type: 'string' },
                        },
                        required: ['question', 'answer'],
                        additionalProperties: false,
                      },
                    },
                    seo: {
                      type: 'object',
                      description: 'SEO metadata for the blog post',
                      properties: {
                        metaTitle: { type: 'string' },
                        metaDescription: { type: 'string' },
                        ogTitle: { type: 'string' },
                        ogDescription: { type: 'string' },
                        robots: { type: 'string' },
                        schemaJsonld: {
                          type: 'object',
                          description: 'JSON-LD schema.org object',
                          properties: {
                            '@context': { type: 'string' },
                            '@type': { type: 'string' },
                            name: { type: 'string' },
                            description: { type: 'string' },
                            headline: { type: 'string' },
                            datePublished: { type: 'string' },
                            dateModified: { type: 'string' },
                            author: {
                              type: 'object',
                              properties: { '@type': { type: 'string' }, name: { type: 'string' } },
                              required: ['@type', 'name'],
                              additionalProperties: false,
                            },
                          },
                          required: ['@context', '@type', 'name', 'description', 'headline', 'datePublished', 'dateModified', 'author'],
                          additionalProperties: false,
                        },
                      },
                      required: ['metaTitle', 'metaDescription', 'ogTitle', 'ogDescription', 'robots', 'schemaJsonld'],
                      additionalProperties: false,
                    },
                  },
                  required: ['blocks', 'toc', 'faq', 'seo'],
                  additionalProperties: false,
                },
              },
              required: ['content', 'metadata'],
              additionalProperties: false,
            },
          },
        } as any,
      });
    } catch (error: any) {
      // Handle specific OpenAI API errors
      if (error?.status === 429) {
        if (error?.message?.includes('quota')) {
          throw new Error('OpenAI API quota aşıldı. Lütfen OpenAI hesabınızın limitlerini kontrol edin veya daha sonra tekrar deneyin.');
        } else if (error?.message?.includes('rate limit')) {
          throw new Error('OpenAI API rate limit aşıldı. Lütfen birkaç dakika bekleyip tekrar deneyin.');
        }
        throw new Error('OpenAI API limiti aşıldı. Lütfen daha sonra tekrar deneyin.');
      } else if (error?.status === 401) {
        throw new Error('OpenAI API anahtarı geçersiz. Lütfen API anahtarınızı kontrol edin.');
      } else if (error?.status === 400) {
        throw new Error(`OpenAI API hatası: ${error?.message || 'Geçersiz istek'}`);
      }
      throw error;
    }

    const latencyMs = Date.now() - startTime;
    const content = response.choices[0]?.message?.content || '';

    return {
      content,
      model: response.model,
      instructions: systemInstructions,
      inputPrompt: userPrompt,
      tokensIn: response.usage?.prompt_tokens || 0,
      tokensOut: response.usage?.completion_tokens || 0,
      latencyMs,
      responseId: response.id,
    };
  }

  private buildSystemInstructions(message: GeneratePostMessage): string {
    // We always store canonical JSON and convert to other formats later.
    const formatInstruction =
      'Return the result strictly as a single valid JSON object matching the JSON schema provided by the system. ' +
      'The JSON must be parseable without any surrounding text, explanations, or code fences.';

    // Language mapping for better GPT understanding
    const languageMap: Record<string, string> = {
      'tr': 'Turkish',
      'en': 'English',
      'de': 'German',
      'fr': 'French',
      'es': 'Spanish',
      'it': 'Italian',
      'pt': 'Portuguese',
      'ru': 'Russian',
      'ar': 'Arabic',
      'ja': 'Japanese',
      'ko': 'Korean',
      'zh': 'Chinese',
      'nl': 'Dutch',
      'pl': 'Polish',
      'sv': 'Swedish',
      'da': 'Danish',
      'no': 'Norwegian',
      'fi': 'Finnish',
      'cs': 'Czech',
      'hu': 'Hungarian',
      'ro': 'Romanian',
      'el': 'Greek',
      'he': 'Hebrew',
      'hi': 'Hindi',
      'th': 'Thai',
      'vi': 'Vietnamese',
      'id': 'Indonesian',
      'ms': 'Malay',
      'uk': 'Ukrainian',
      'bg': 'Bulgarian',
      'hr': 'Croatian',
      'sk': 'Slovak',
      'sl': 'Slovenian',
      'et': 'Estonian',
      'lv': 'Latvian',
      'lt': 'Lithuanian',
    };

    // Handle language: could be enum value (PostLanguage.EN = 'en') or string ('en', 'tr')
    let languageCode = message.language;
    if (languageCode && typeof languageCode === 'object') {
      // If it's an enum object, extract the value
      languageCode = (languageCode as any).value || (languageCode as any);
    }
    languageCode = typeof languageCode === 'string' ? languageCode.toLowerCase() : 'tr';
    
    const languageName = languageMap[languageCode] || (languageCode === 'en' ? 'English' : 'Turkish');
    
    this.logger.log(`Generating blog in language: ${languageCode} (${languageName})`);

    const instructions = [
      message.seoMode
        ? 'You are an SEO assistant. Optimize the content ONLY structurally and semantically. Do NOT change the topic, tone, or intent. Rules: - Use exactly one H1 title - Add logical H2 and H3 headings where appropriate - Ensure the main topic appears naturally in the introduction - Write a short, clear introduction (2–3 sentences) - Add a conclusion section - Avoid keyword stuffing - Keep the content concise and natural - If meta title or meta description are missing, generate them - Do not add unrelated content'
        : 'You are an expert blog writer and content creator with deep knowledge of SEO, engaging writing, and audience communication.',
      `Write the entire blog post in ${languageName}. All content, including headings, paragraphs, FAQ, and any text, must be in ${languageName}.`,
      `Maintain a ${message.tone || 'professional'} tone throughout the content.`,
      message.seoMode
        ? 'Optimize for SEO: Use relevant keywords naturally, include meta descriptions, use proper heading structure (H1, H2, H3), and ensure content is search engine friendly.'
        : 'Write engaging, well-structured content.',
      'The JSON object must conform to: { "content": "markdown body of the blog post", "metadata": { "blocks": [...], "toc": [...], "faq": [...], "seo": {...} } }.',
      'The "content" field must contain the full blog post in Markdown format, including headings and all sections.',
      'Use "metadata.blocks" only if helpful; always make sure "content" alone is a complete article.',
      'If FAQ items or SEO metadata are relevant, include them under "metadata.faq" and "metadata.seo".',
      formatInstruction,
    ].filter(Boolean);

    return instructions.join(' ');
  }

  private resolveModel(modelOrTier?: string): string {
    if (!modelOrTier) {
      return 'gpt-4.1-mini';
    }

    const normalized = modelOrTier.trim().toLowerCase();
    if (normalized === 'ucuz' || normalized === 'cheap') {
      return 'gpt-4.1-mini';
    }
    if (normalized === 'orta' || normalized === 'medium') {
      return 'gpt-4.1';
    }
    if (normalized === 'pahali' || normalized === 'pahalı' || normalized === 'expensive') {
      return 'gpt-5';
    }

    return modelOrTier;
  }

  private buildUserPrompt(message: GeneratePostMessage): string {
    const lengthDescriptions: Record<string, string> = {
      short: '300-500 words',
      medium: '500-1000 words',
      long: '1000+ words',
    };

    const lengthDesc = lengthDescriptions[message.length || 'medium'] || '500-1000 words';

    // Language mapping for better GPT understanding
    const languageMap: Record<string, string> = {
      'tr': 'Turkish',
      'en': 'English',
      'de': 'German',
      'fr': 'French',
      'es': 'Spanish',
      'it': 'Italian',
      'pt': 'Portuguese',
      'ru': 'Russian',
      'ar': 'Arabic',
      'ja': 'Japanese',
      'ko': 'Korean',
      'zh': 'Chinese',
      'nl': 'Dutch',
      'pl': 'Polish',
      'sv': 'Swedish',
      'da': 'Danish',
      'no': 'Norwegian',
      'fi': 'Finnish',
      'cs': 'Czech',
      'hu': 'Hungarian',
      'ro': 'Romanian',
      'el': 'Greek',
      'he': 'Hebrew',
      'hi': 'Hindi',
      'th': 'Thai',
      'vi': 'Vietnamese',
      'id': 'Indonesian',
      'ms': 'Malay',
      'uk': 'Ukrainian',
      'bg': 'Bulgarian',
      'hr': 'Croatian',
      'sk': 'Slovak',
      'sl': 'Slovenian',
      'et': 'Estonian',
      'lv': 'Latvian',
      'lt': 'Lithuanian',
    };

    // Handle language: could be enum value (PostLanguage.EN = 'en') or string ('en', 'tr')
    let languageCode = message.language;
    if (languageCode && typeof languageCode === 'object') {
      // If it's an enum object, extract the value
      languageCode = (languageCode as any).value || (languageCode as any);
    }
    languageCode = typeof languageCode === 'string' ? languageCode.toLowerCase() : 'tr';
    
    const languageName = languageMap[languageCode] || (languageCode === 'en' ? 'English' : 'Turkish');

    let prompt = `Write a comprehensive blog post about: "${message.topic}"\n\n`;
    prompt += `Language: Write everything in ${languageName}. All content must be in ${languageName}.\n`;
    prompt += `Length: ${lengthDesc}\n`;

    if (message.tone) {
      prompt += `Tone: ${message.tone}\n`;
    }

    if (message.targetAudience) {
      prompt += `Target Audience: ${message.targetAudience}\n`;
    }

    if (message.additionalContext) {
      prompt += `\nAdditional Context:\n${message.additionalContext}\n`;
    }

    if (message.seoMode) {
      prompt += `\nSEO Optimization Instructions:\n`;
      prompt += `You are an SEO assistant. Optimize the content ONLY structurally and semantically.\n`;
      prompt += `Do NOT change the topic, tone, or intent.\n\n`;
      prompt += `Rules:\n`;
      prompt += `- Use exactly one H1 title\n`;
      prompt += `- Add logical H2 and H3 headings where appropriate\n`;
      prompt += `- Ensure the main topic appears naturally in the introduction\n`;
      prompt += `- Write a short, clear introduction (2–3 sentences)\n`;
      prompt += `- Add a conclusion section\n`;
      prompt += `- Avoid keyword stuffing\n`;
      prompt += `- Keep the content concise and natural\n`;
      prompt += `- If meta title or meta description are missing, generate them\n`;
      prompt += `- Do not add unrelated content\n`;
      prompt += `- Use relevant keywords naturally throughout the content\n`;
      prompt += `- Include a compelling meta description\n`;
      prompt += `- Use proper heading hierarchy (H1 for title, H2 for main sections, H3 for subsections)\n`;
      prompt += `- Ensure content is optimized for search engines\n`;
    }

    prompt += `\nStructure (for the article, not for the JSON):\n`;
    prompt += `1. Engaging introduction that hooks the reader\n`;
    prompt += `2. Main content with clear sections and subheadings\n`;
    prompt += `3. Conclusion that summarizes key points\n\n`;
    prompt += `Return the blog post as a single JSON object that matches the system JSON schema. `;
    prompt += `The "content" property must contain the full article in Markdown, and any additional structure (toc, faq, seo) must be placed inside "metadata". `;
    prompt += `Do not return anything except this JSON object.`;

    return prompt;
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

