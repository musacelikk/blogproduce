import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { WorkerAppModule } from './worker-app.module';
import { WorkerService } from './worker.service';

/**
 * SQS consumer entrypoint.
 *
 * Boots `WorkerAppModule` rather than `AppModule`: see that file for why. There
 * is no HTTP server here — `createApplicationContext` builds the DI container
 * and nothing else.
 */
async function bootstrap() {
  const logger = new Logger('Worker');
  const app = await NestFactory.createApplicationContext(WorkerAppModule);
  app.enableShutdownHooks();

  const workerService = app.get(WorkerService);
  await workerService.start();
  logger.log('Worker başlatıldı — SQS dinleniyor.');

  let shuttingDown = false;
  const shutdown = async (signal: string) => {
    // SIGTERM can arrive twice during a rolling deploy; draining twice would
    // close the context underneath the first drain.
    if (shuttingDown) return;
    shuttingDown = true;

    logger.log(`${signal} alındı — worker kapatılıyor...`);
    try {
      await workerService.stop();
      await app.close();
    } catch (err) {
      logger.error(`Kapatma sırasında hata: ${(err as Error).message}`);
    }
    process.exit(0);
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

bootstrap();
