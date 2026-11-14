import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Webhook, WebhookEvent } from '../entities/webhook.entity';
import * as crypto from 'crypto';
import * as https from 'https';
import {
  isPrivateHost,
  privateSafeLookup,
} from '../common/validators/is-public-https-url.validator';

/**
 * Wall-clock bound on one delivery, independent of socket activity.
 * Overridable so tests need not wait ten seconds for the deadline to fire.
 */
const DELIVERY_DEADLINE_MS = Number(process.env.WEBHOOK_DELIVERY_DEADLINE_MS) || 10_000;

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

    const relevantWebhooks = webhooks.filter((webhook) => webhook.events.includes(event));

    if (relevantWebhooks.length === 0) {
      this.logger.debug(
        `No webhooks found for event ${event} in organization ${organizationId}, project ${projectId}`,
      );
      return;
    }

    // Send webhook to each relevant webhook
    const promises = relevantWebhooks.map((webhook) => this.sendWebhook(webhook, event, payload));

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

    // Re-validate at delivery time: a hostname that was public at registration can be
    // re-pointed at an internal address later (DNS rebinding).
    if (url.protocol !== 'https:' || isPrivateHost(url.hostname)) {
      this.logger.warn(
        `Refusing to deliver webhook ${webhook.id} to non-public URL: ${url.origin}`,
      );
      throw new Error('Webhook URL is not a public https endpoint');
    }

    const client = https;

    const options = {
      hostname: url.hostname,
      port: url.port || 443,
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
      // Closes DNS rebinding with no time-of-check/time-of-use gap: the address
      // this returns is the one the socket connects to, so the public answer
      // checked above cannot be swapped for a private one afterwards.
      lookup: privateSafeLookup,
    };

    return new Promise((resolve, reject) => {
      // The promise must settle exactly once: the inactivity timeout, the
      // absolute deadline and a socket error can all fire for the same request.
      let settled = false;
      const finish = (fn: () => void) => {
        if (settled) return;
        settled = true;
        clearTimeout(deadline);
        fn();
      };

      const req = client.request(options, (res) => {
        // Drain without buffering. The status code is the only thing used here,
        // and the body is a remote endpoint's to choose — accumulating it into
        // a string was unbounded growth in exchange for nothing.
        res.resume();

        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            // Success
            webhook.lastTriggeredAt = new Date();
            webhook.failureCount = 0;
            this.webhookRepository.save(webhook).catch((err) => {
              this.logger.error(`Failed to update webhook ${webhook.id}: ${err.message}`);
            });

            this.logger.log(`Webhook ${webhook.id} delivered successfully for event ${event}`);
            finish(resolve);
          } else {
            // Failure
            webhook.failureCount = (webhook.failureCount || 0) + 1;
            this.webhookRepository.save(webhook).catch((err) => {
              this.logger.error(`Failed to update webhook ${webhook.id}: ${err.message}`);
            });

            this.logger.warn(
              `Webhook ${webhook.id} failed with status ${res.statusCode} for event ${event}`,
            );
            finish(() => reject(new Error(`Webhook failed with status ${res.statusCode}`)));
          }
        });
      });

      req.on('error', (error) => {
        webhook.failureCount = (webhook.failureCount || 0) + 1;
        this.webhookRepository.save(webhook).catch((err) => {
          this.logger.error(`Failed to update webhook ${webhook.id}: ${err.message}`);
        });

        this.logger.error(`Webhook ${webhook.id} request failed: ${error.message}`);
        finish(() => reject(error));
      });

      req.on('timeout', () => {
        req.destroy();
        webhook.failureCount = (webhook.failureCount || 0) + 1;
        this.webhookRepository.save(webhook).catch((err) => {
          this.logger.error(`Failed to update webhook ${webhook.id}: ${err.message}`);
        });

        this.logger.error(`Webhook ${webhook.id} request timed out`);
        finish(() => reject(new Error('Webhook request timed out')));
      });

      // `options.timeout` is a socket *inactivity* timeout, so an endpoint that
      // dribbles a byte every nine seconds holds the request open forever. This
      // is the wall-clock bound the docs actually promise.
      const deadline = setTimeout(() => {
        req.destroy();
        webhook.failureCount = (webhook.failureCount || 0) + 1;
        this.webhookRepository.save(webhook).catch((err) => {
          this.logger.error(`Failed to update webhook ${webhook.id}: ${err.message}`);
        });

        this.logger.error(`Webhook ${webhook.id} exceeded the ${DELIVERY_DEADLINE_MS}ms deadline`);
        finish(() => reject(new Error('Webhook request exceeded its deadline')));
      }, DELIVERY_DEADLINE_MS);

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
