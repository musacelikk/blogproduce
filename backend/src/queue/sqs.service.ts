import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';

export interface GeneratePostMessage {
  jobId: string; // Unique job ID for idempotency
  postId: string;
  workspaceId: string;
  language: string;
  topic: string;
  tone: string;
  length: string;
  seoMode: boolean;
  model?: string; // 'gpt-4o-mini' | 'gpt-4.1-mini' | 'gpt-4.1'
  additionalContext?: string;
  targetAudience?: string;
  format?: string; // 'md' | 'html' | 'json'
  targetId?: string;
  retryCount?: number; // Track retry attempts
}

export interface PublishPostMessage {
  postId: string;
  targetId: string;
}

@Injectable()
export class SqsService {
  private readonly logger = new Logger(SqsService.name);
  private sqsClient: SQSClient;
  private generatePostQueueUrl: string;
  private generatePostDlqUrl: string;
  private publishPostQueueUrl: string;
  private publishPostDlqUrl: string;

  constructor(private configService: ConfigService) {
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

    this.generatePostQueueUrl = this.configService.get<string>('SQS_GENERATE_POST_QUEUE_URL') || '';
    this.generatePostDlqUrl = this.configService.get<string>('SQS_GENERATE_POST_DLQ_URL') || '';
    this.publishPostQueueUrl = this.configService.get<string>('SQS_PUBLISH_POST_QUEUE_URL') || '';
    this.publishPostDlqUrl = this.configService.get<string>('SQS_PUBLISH_POST_DLQ_URL') || '';

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

  async sendGeneratePostMessage(message: GeneratePostMessage): Promise<void> {
    if (!this.generatePostQueueUrl) {
      this.logger.warn('SQS_GENERATE_POST_QUEUE_URL not configured, skipping message send');
      return;
    }

    try {
      const command = new SendMessageCommand({
        QueueUrl: this.generatePostQueueUrl,
        MessageBody: JSON.stringify(message),
        MessageAttributes: {
          MessageType: {
            DataType: 'String',
            StringValue: 'GENERATE_POST',
          },
        },
      });

      await this.sqsClient.send(command);
      this.logger.log(`Generate post message sent for postId: ${message.postId}`);
    } catch (error) {
      this.logger.error(`Failed to send generate post message: ${error.message}`, error.stack);
      throw error;
    }
  }

  async sendPublishPostMessage(message: PublishPostMessage): Promise<void> {
    if (!this.publishPostQueueUrl) {
      this.logger.warn('SQS_PUBLISH_POST_QUEUE_URL not configured, skipping message send');
      return;
    }

    try {
      const command = new SendMessageCommand({
        QueueUrl: this.publishPostQueueUrl,
        MessageBody: JSON.stringify(message),
        MessageAttributes: {
          MessageType: {
            DataType: 'String',
            StringValue: 'PUBLISH_POST',
          },
        },
      });

      await this.sqsClient.send(command);
      this.logger.log(`Publish post message sent for postId: ${message.postId}`);
    } catch (error) {
      this.logger.error(`Failed to send publish post message: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Manually send a message to DLQ (if needed for manual error handling)
   * Note: AWS SQS automatically moves messages to DLQ after max receive count
   */
  async sendToGeneratePostDlq(message: GeneratePostMessage, errorReason?: string): Promise<void> {
    if (!this.generatePostDlqUrl) {
      this.logger.warn('SQS_GENERATE_POST_DLQ_URL not configured, skipping DLQ send');
      return;
    }

    try {
      const command = new SendMessageCommand({
        QueueUrl: this.generatePostDlqUrl,
        MessageBody: JSON.stringify({
          ...message,
          errorReason,
          movedToDlqAt: new Date().toISOString(),
        }),
        MessageAttributes: {
          MessageType: {
            DataType: 'String',
            StringValue: 'GENERATE_POST_DLQ',
          },
        },
      });

      await this.sqsClient.send(command);
      this.logger.warn(`Message sent to generate post DLQ for postId: ${message.postId}`);
    } catch (error) {
      this.logger.error(`Failed to send message to DLQ: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get queue URLs (for monitoring/debugging)
   */
  getQueueUrls() {
    return {
      generatePostQueue: this.generatePostQueueUrl,
      generatePostDlq: this.generatePostDlqUrl,
      publishPostQueue: this.publishPostQueueUrl,
      publishPostDlq: this.publishPostDlqUrl,
    };
  }
}

