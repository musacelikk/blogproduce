import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AutopilotService } from './autopilot.service';

/**
 * Autopilot's clock.
 *
 * Both crons run in the API *and* the worker process, because both bootstrap
 * the full `AppModule`. Neither method may assume it is alone: `runDue` claims
 * each config with a conditional UPDATE and `publishReadyPosts` claims each
 * post the same way, so a doubled tick is a no-op rather than a double spend.
 *
 * Hourly is deliberate. Cadence is measured in days, so a tighter schedule
 * would only add idle queries — and these crons are the reason autopilot needs
 * no process of its own, so they must stay cheap.
 */
@Injectable()
export class AutopilotSchedulerService {
  private readonly logger = new Logger(AutopilotSchedulerService.name);

  constructor(private readonly autopilot: AutopilotService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async startDueArticles(): Promise<void> {
    try {
      const { started } = await this.autopilot.runDue();
      if (started > 0) {
        this.logger.log(`Otopilot: ${started} makale üretime alındı.`);
      }
    } catch (err) {
      this.logger.error(
        `Otopilot üretim turu başarısız: ${(err as Error).message}`,
        (err as Error).stack,
      );
    }
  }

  /**
   * Separate from the production tick: an article finishes generating minutes
   * after it is enqueued, and a config with `autoPublish` should not wait for
   * the next hourly tick to go live.
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async publishFinishedArticles(): Promise<void> {
    try {
      await this.autopilot.publishReadyPosts();
    } catch (err) {
      this.logger.error(
        `Otopilot yayın turu başarısız: ${(err as Error).message}`,
        (err as Error).stack,
      );
    }
  }
}
