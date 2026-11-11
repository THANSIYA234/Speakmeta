import { Injectable, Logger } from '@nestjs/common';

import type {
  SpeechToTextProvider,
  TranscriptionRequest,
  TranscriptionResult,
} from './speech-to-text.provider';

export interface OpenAiProviderOptions {
  apiKey: string;
  baseUrl: string;
  model: string;
  timeoutMs: number;
}

/**
 * Transcribes audio with the OpenAI audio transcription API.
 *
 * The API key never leaves the backend: the browser only ever talks to this
 * service.
 */
@Injectable()
export class OpenAiProvider implements SpeechToTextProvider {
  readonly name = 'openai';

  private readonly logger = new Logger(OpenAiProvider.name);

  constructor(private readonly options: OpenAiProviderOptions) {}

  async transcribe(request: TranscriptionRequest): Promise<TranscriptionResult> {
    const form = new FormData();
    form.append(
      'file',
      new Blob([new Uint8Array(request.audio)], { type: request.mimeType }),
      request.fileName,
    );
    form.append('model', this.options.model);
    if (request.language) {
      form.append('language', request.language);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.options.timeoutMs);

    try {
      const response = await fetch(`${this.options.baseUrl}/audio/transcriptions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.options.apiKey}`,
        },
        body: form,
        signal: controller.signal,
      });

      if (!response.ok) {
        const detail = await response.text();
        this.logger.error(
          `Transcription failed with status ${response.status}: ${detail.slice(0, 500)}`,
        );
        throw new Error(`Transcription provider responded with status ${response.status}.`);
      }

      const payload = (await response.json()) as { text?: unknown; duration?: unknown };

      if (typeof payload.text !== 'string') {
        throw new Error('Transcription provider returned an unexpected response.');
      }

      return {
        text: payload.text.trim(),
        durationSeconds:
          typeof payload.duration === 'number' ? payload.duration : undefined,
        provider: this.name,
      };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Transcription provider timed out.');
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }
}
