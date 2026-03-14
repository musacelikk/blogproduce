import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Webhook, WebhookEvent } from '../entities/webhook.entity';
import * as crypto from 'crypto';
import * as https from 'https';
import * as http from 'http';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    @InjectRepository(Webhook)
    private webhookRepository: Repository<Webhook>,
  ) {}

  /**
   * Trigger webhook for an event
   */
  async triggerWebhook(
    organizationId: string,
    projectId: string,
    event: WebhookEvent,
    payload: Record<string, any>,
  ): Promise<void> {
    // Find active webhooks for this organization/project that listen to this event
    const webhooks = await this.webhookRepository.find({
      where: {
        organizationId,
        projectId,
        active: true,
      },
    });

    const relevantWebhooks = webhooks.filter((webhook) =>
      webhook.events.includes(event),
    );

    if (relevantWebhooks.length === 0) {
      this.logger.debug(`No webhooks found for event ${event} in organization ${organizationId}, project ${projectId}`);
      return;
    }

    // Send webhook to each relevant webhook
    const promises = relevantWebhooks.map((webhook) =>
      this.sendWebhook(webhook, event, payload),
    );

    await Promise.allSettled(promises);
  }

  /**
   * Send webhook HTTP request
   */
  private async sendWebhook(
    webhook: Webhook,
    event: WebhookEvent,
    payload: Record<string, any>,
  ): Promise<void> {
    const webhookPayload = {
      event,
      timestamp: new Date().toISOString(),
      data: payload,
    };

    const body = JSON.stringify(webhookPayload);
    const signature = this.generateSignature(body, webhook.secret);

    const url = new URL(webhook.url);
    const isHttps = url.protocol === 'https:';
    const client = isHttps ? https : http;

    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        'X-Webhook-Event': event,
        'X-Webhook-Signature': signature,
        'X-Webhook-Timestamp': new Date().toISOString(),
      },
      timeout: 10000, // 10 seconds
    };

    return new Promise((resolve, reject) => {
      const req = client.request(options, (res) => {
        let responseData = '';

        res.on('data', (chunk) => {
          responseData += chunk;
        });

        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            // Success
            webhook.lastTriggeredAt = new Date();
            webhook.failureCount = 0;
            this.webhookRepository.save(webhook).catch((err) => {
              this.logger.error(`Failed to update webhook ${webhook.id}: ${err.message}`);
            });

            this.logger.log(`Webhook ${webhook.id} delivered successfully for event ${event}`);
            resolve();
          } else {
            // Failure
            webhook.failureCount = (webhook.failureCount || 0) + 1;
            this.webhookRepository.save(webhook).catch((err) => {
              this.logger.error(`Failed to update webhook ${webhook.id}: ${err.message}`);
            });

            this.logger.warn(
              `Webhook ${webhook.id} failed with status ${res.statusCode} for event ${event}`,
            );
            reject(new Error(`Webhook failed with status ${res.statusCode}`));
          }
        });
      });

      req.on('error', (error) => {
        webhook.failureCount = (webhook.failureCount || 0) + 1;
        this.webhookRepository.save(webhook).catch((err) => {
          this.logger.error(`Failed to update webhook ${webhook.id}: ${err.message}`);
        });

        this.logger.error(`Webhook ${webhook.id} request failed: ${error.message}`);
        reject(error);
      });

      req.on('timeout', () => {
        req.destroy();
        webhook.failureCount = (webhook.failureCount || 0) + 1;
        this.webhookRepository.save(webhook).catch((err) => {
          this.logger.error(`Failed to update webhook ${webhook.id}: ${err.message}`);
        });

        this.logger.error(`Webhook ${webhook.id} request timed out`);
        reject(new Error('Webhook request timed out'));
      });

      req.write(body);
      req.end();
    });
  }

  /**
   * Generate HMAC signature for webhook payload
   */
  private generateSignature(payload: string, secret: string | null): string {
    if (!secret) {
      return '';
    }

    return crypto.createHmac('sha256', secret).update(payload).digest('hex');
  }
}

