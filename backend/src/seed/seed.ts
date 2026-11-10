import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { SeedService } from './services/seed.service';

/**
 * Standalone entry point (npm run seed) — no HTTP surface needed for a
 * one-off data load, so this boots an application context instead of
 * the full HTTP server.
 */
async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    await app.get(SeedService).execute();
  } finally {
    await app.close();
  }
}

bootstrap();
