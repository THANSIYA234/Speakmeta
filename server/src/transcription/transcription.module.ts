import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

import { TranscriptionController } from './transcription.controller';
import { TranscriptionService } from './transcription.service';
import { MockProvider } from './providers/mock.provider';
import { OpenAiProvider } from './providers/openai.provider';
import type { SpeechToTextProvider } from './providers/speech-to-text.provider';

@Module({
  imports: [
    // The upload limit lives in the configuration, so multer is set up from the
    // same source of truth as the service-side validation.
    MulterModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        storage: memoryStorage(),
        limits: {
          fileSize: config.get<number>('stt.maxUploadBytes') ?? 25 * 1024 * 1024,
          files: 1,
        },
      }),
    }),
  ],
  controllers: [TranscriptionController],
  providers: [
    {
      provide: MockProvider,
      useClass: MockProvider,
    },
    {
      provide: OpenAiProvider,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const openai = config.get<{
          apiKey: string | null;
          baseUrl: string;
          model: string;
          timeoutMs: number;
        }>('stt.openai');

        return new OpenAiProvider({
          apiKey: openai?.apiKey ?? '',
          baseUrl: openai?.baseUrl ?? 'https://api.openai.com/v1',
          model: openai?.model ?? 'whisper-1',
          timeoutMs: openai?.timeoutMs ?? 120_000,
        });
      },
    },
    {
      provide: 'SPEECH_TO_TEXT_PROVIDER',
      inject: [ConfigService, MockProvider, OpenAiProvider],
      useFactory: (
        config: ConfigService,
        mock: MockProvider,
        openai: OpenAiProvider,
      ): SpeechToTextProvider => {
        const provider = config.get<string>('stt.provider');

        if (provider === 'mock') {
          return mock;
        }
        return openai;
      },
    },
    {
      provide: TranscriptionService,
      inject: ['SPEECH_TO_TEXT_PROVIDER', ConfigService],
      useFactory: (
        provider: SpeechToTextProvider,
        config: ConfigService,
      ): TranscriptionService =>
        new TranscriptionService(
          provider,
          config.get<number>('stt.maxUploadBytes') ?? 25 * 1024 * 1024,
        ),
    },
  ],
})
export class TranscriptionModule {}
