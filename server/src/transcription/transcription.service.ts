import { BadRequestException, Injectable, Logger, PayloadTooLargeException } from '@nestjs/common';

import { extensionForMimeType, validateAudioUpload } from './audio-validation';
import type { SpeechToTextProvider } from './providers/speech-to-text.provider';

export interface TranscribeInput {
  buffer: Buffer | undefined;
  mimetype: string | undefined;
  originalname: string | undefined;
  language?: string;
}

export interface TranscriptionPayload {
  text: string;
  language: string | null;
  durationSeconds: number | null;
  provider: string;
}

/**
 * Turns an uploaded recording into text.
 *
 * The service owns the rules about what a valid upload is and how the provider
 * is called; the controller only deals with HTTP.
 */
@Injectable()
export class TranscriptionService {
  private readonly logger = new Logger(TranscriptionService.name);

  constructor(
    private readonly provider: SpeechToTextProvider,
    private readonly maxUploadBytes: number,
  ) {}

  /** The provider currently wired up, for diagnostics. */
  get providerName(): string {
    return this.provider.name;
  }

  async transcribe(input: TranscribeInput): Promise<TranscriptionPayload> {
    const validation = validateAudioUpload({
      buffer: input.buffer,
      mimetype: input.mimetype,
      originalname: input.originalname,
      maxBytes: this.maxUploadBytes,
    });

    if (!validation.valid) {
      if (validation.reason === 'too-large') {
        throw new PayloadTooLargeException(validation.message);
      }
      throw new BadRequestException(validation.message);
    }

    const language = this.normalizeLanguage(input.language);

    const fileName = this.buildFileName(input.originalname, input.mimetype);
    const mimeType = this.resolveMimeType(input.mimetype);

    this.logger.log(`Transcribing ${fileName} (${input.buffer?.length ?? 0} bytes) via ${this.provider.name}`);

    try {
      const result = await this.provider.transcribe({
        audio: input.buffer as Buffer,
        fileName,
        mimeType,
        language,
      });

      return {
        text: result.text,
        language: language ?? null,
        durationSeconds: result.durationSeconds ?? null,
        provider: result.provider,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown provider error.';
      this.logger.error(`Transcription failed: ${message}`);
      throw new BadRequestException(`Transcription failed: ${message}`);
    }
  }

  /** Accepts a plain language code; anything else is ignored rather than rejected. */
  private normalizeLanguage(language?: string): string | undefined {
    const trimmed = language?.trim().toLowerCase();
    if (!trimmed) return undefined;
    return /^[a-z]{2,3}(-[a-z0-9]{2,8})*$/.test(trimmed) ? trimmed : undefined;
  }

  /** Keeps the uploaded name but makes sure the extension matches the audio type. */
  private buildFileName(originalname: string | undefined, mimetype: string | undefined): string {
    const base = (originalname ?? 'recording').replace(/[^a-zA-Z0-9._-]/g, '_');
    const stem = base.replace(/\.[^.]+$/, '') || 'recording';
    return `${stem}${extensionForMimeType(mimetype ?? '')}`;
  }

  private resolveMimeType(mimetype: string | undefined): string {
    const type = (mimetype ?? 'audio/webm').split(';')[0].trim().toLowerCase();
    return type || 'audio/webm';
  }
}
