import { Injectable } from '@nestjs/common';

import type {
  SpeechToTextProvider,
  TranscriptionRequest,
  TranscriptionResult,
} from './speech-to-text.provider';

/**
 * A deterministic provider for local development and automated tests.
 *
 * It is opt-in through `STT_PROVIDER=mock` and never used as a silent
 * fallback: if the environment asks for `openai` and the key is missing, the
 * process refuses to boot.
 */
@Injectable()
export class MockProvider implements SpeechToTextProvider {
  readonly name = 'mock';

  async transcribe(request: TranscriptionRequest): Promise<TranscriptionResult> {
    const seconds = Math.max(1, Math.round(request.audio.length / 16_000));

    return {
      text: `Mock transcription for ${request.fileName} (${seconds}s of audio).`,
      durationSeconds: seconds,
      provider: this.name,
    };
  }
}
