/**
 * The provider contract.
 *
 * The controller and the service only ever talk to this interface, so the
 * speech-to-text vendor can be swapped without touching the HTTP layer.
 */
export interface TranscriptionRequest {
  /** The raw audio bytes. */
  audio: Buffer;
  /** The file name to send to the provider, extension included. */
  fileName: string;
  /** The MIME type of the audio. */
  mimeType: string;
  /** Optional BCP-47 language hint, e.g. `en`. */
  language?: string;
}

export interface TranscriptionResult {
  /** The recognised text. */
  text: string;
  /** Provider-reported duration in seconds, when available. */
  durationSeconds?: number;
  /** The provider that produced the result. */
  provider: string;
}

export interface SpeechToTextProvider {
  /** Identifier reported to the client, e.g. `openai`. */
  readonly name: string;
  /** Transcribes a single audio recording. */
  transcribe(request: TranscriptionRequest): Promise<TranscriptionResult>;
}
