import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { WorkerService } from './worker.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const workerService = app.get(WorkerService);

  // Start worker
  await workerService.start();

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('Shutting down worker...');
    await workerService.stop();
    await app.close();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('Shutting down worker...');
    await workerService.stop();
    await app.close();
    process.exit(0);
  });
}

bootstrap();

