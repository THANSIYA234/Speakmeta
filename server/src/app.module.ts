import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { loadConfig } from './config/configuration';
import { TranscriptionModule } from './transcription/transcription.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [() => loadConfig()],
    }),
    TranscriptionModule,
  ],
})
export class AppModule {}
