import { Injectable, Logger } from '@nestjs/common';

import {
  needsTranscode,
  transcodeToMp3,
  withExtension,
} from '../audio-transcode';
import type {
  SpeechToTextProvider,
  TranscriptionRequest,
  TranscriptionResult,
} from './speech-to-text.provider';

export interface MiniMaxProviderOptions {
  apiKey: string;
  baseUrl: string;
  model: string;
  timeoutMs: number;
  /** Path or name of the ffmpeg binary used to convert the upload. */
  ffmpegPath: string;
}

/**
 * The languages the endpoint accepts as a hint.
 *
 * The hint travels as an HTTP header, and the service documents a fixed list
 * of language codes. A regional tag such as `en-gb` is not on it, so only the
 * primary subtag is sent, and only when it is one of the supported codes.
 */
const SUPPORTED_LANGUAGES: Record<string, true> = {
  zh: true,
  yue: true,
  en: true,
  ja: true,
  ko: true,
  th: true,
  vi: true,
  id: true,
  ms: true,
  fil: true,
  ar: true,
  tr: true,
  fr: true,
  de: true,
  es: true,
  it: true,
  pt: true,
  pl: true,
  ru: true,
  uk: true,
};

/**
 * Maps a BCP-47 hint to a language the endpoint understands.
 *
 * Returns `undefined` when the language is not supported, which leaves the
 * endpoint on its own automatic detection.
 */
export function toMiniMaxLanguage(language: string | undefined): string | undefined {
  const primary = language?.split('-')[0]?.trim().toLowerCase();
  if (!primary) return undefined;
  return Object.hasOwn(SUPPORTED_LANGUAGES, primary) ? primary : undefined;
}

/**
 * Reads the message out of an error body.
 *
 * MiniMax answers failures with an OpenAI-style envelope,
 * `{"type":"error","error":{"message":"..."}}`, which says more than the status
 * code alone: an insufficient balance and an unsupported file need different
 * answers.
 */
export function readProviderMessage(detail: string): string | undefined {
  try {
    const parsed = JSON.parse(detail) as { error?: { message?: unknown } };
    const message = parsed.error?.message;
    return typeof message === 'string' ? message : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Transcribes audio with MiniMax's speech-to-text API.
 *
 * The endpoint is not OpenAI-compatible: it lives at `/v1/speech_to_text`
 * instead of `/v1/audio/transcriptions`, and the language hint travels as an
 * HTTP header rather than a form field. The upload itself is sent as multipart
 * form data with the same `file` and `model` fields OpenAI uses.
 *
 * MiniMax also rejects the containers the browsers record (WebM and MP4), so
 * the audio is converted to MP3 before it is sent.
 */
@Injectable()
export class MiniMaxProvider implements SpeechToTextProvider {
  readonly name = 'minimax';

  private readonly logger = new Logger(MiniMaxProvider.name);

  constructor(private readonly options: MiniMaxProviderOptions) {}

  async transcribe(request: TranscriptionRequest): Promise<TranscriptionResult> {
    const { audio, fileName, mimeType } = await this.prepareUpload(request);

    const form = new FormData();
    form.append('file', new Blob([new Uint8Array(audio)], { type: mimeType }), fileName);
    form.append('model', this.options.model);

    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.options.apiKey}`,
    };
    const language = toMiniMaxLanguage(request.language);
    if (language) {
      headers.language = language;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.options.timeoutMs);

    try {
      const response = await fetch(`${this.options.baseUrl}/speech_to_text`, {
        method: 'POST',
        headers,
        body: form,
        signal: controller.signal,
      });

      if (!response.ok) {
        const detail = await response.text();
        this.logger.error(
          `Transcription failed with status ${response.status}: ${detail.slice(0, 500)}`,
        );
        const reason = readProviderMessage(detail);
        throw new Error(
          `Transcription provider responded with status ${response.status}.${
            reason ? ` ${reason}` : ''
          }`,
        );
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

  /**
   * Converts the upload when MiniMax would not accept its container.
   *
   * A browser recording is WebM or MP4; both are rejected, so they are
   * transcoded to mono 16 kHz MP3. Anything MiniMax already accepts is sent
   * untouched.
   */
  private async prepareUpload(
    request: TranscriptionRequest,
  ): Promise<{ audio: Buffer; fileName: string; mimeType: string }> {
    if (!needsTranscode(request.mimeType)) {
      return {
        audio: request.audio,
        fileName: request.fileName,
        mimeType: request.mimeType,
      };
    }

    this.logger.debug(`Converting ${request.fileName} for MiniMax`);

    const audio = await transcodeToMp3(request.audio, {
      ffmpegPath: this.options.ffmpegPath,
      timeoutMs: this.options.timeoutMs,
    });

    return {
      audio,
      fileName: withExtension(request.fileName, '.mp3'),
      mimeType: 'audio/mpeg',
    };
  }
}
