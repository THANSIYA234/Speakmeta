import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { loadConfig } from './config/configuration';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const config = loadConfig();

  app.setGlobalPrefix('api');
  app.enableCors({
    origin: config.corsOrigins,
    methods: ['GET', 'POST'],
  });

  await app.listen(config.port, '0.0.0.0');

  const logger = new Logger('Bootstrap');
  logger.log(`SpeakMate API listening on http://localhost:${config.port}/api`);
  logger.log(`Speech-to-text provider: ${config.stt.provider}`);
}

void bootstrap();
