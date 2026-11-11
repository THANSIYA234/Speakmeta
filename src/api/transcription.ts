/**
 * Client for the speech-to-text backend.
 *
 * The browser talks to the Nest service directly, so the base URL is the only
 * piece of configuration the frontend needs. It comes from the environment so
 * the same build can point at a local backend or a deployed one.
 */

/** A transcription as the backend returns it. */
export interface TranscriptionResponse {
  text: string;
  language: string | null;
  durationSeconds: number | null;
  provider: string;
}

/** The backend refuses uploads above this size, so the browser refuses them too. */
export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

/**
 * A failed transcription request.
 *
 * `status` is the HTTP status of the failing response, or `0` when the
 * request never reached the backend at all (a validation failure or a
 * network problem). The message is always fit to be shown to the user.
 */
export class TranscriptionApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'TranscriptionApiError';
    this.status = status;
  }
}

/**
 * Whether a rejection is an aborted request.
 *
 * `DOMException` does not extend `Error` everywhere, so the name is checked
 * instead of the prototype chain.
 */
export function isAbortError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null || !('name' in error)) return false;
  return error.name === 'AbortError';
}

/** The backend the browser talks to, without a trailing slash. */
export function apiBaseUrl(): string {
  const configured: unknown = import.meta.env.VITE_API_BASE_URL;
  const base =
    typeof configured === 'string' && configured.trim()
      ? configured.trim()
      : 'http://localhost:3000';
  return base.replace(/\/+$/, '');
}

/** Reads a string field from an unknown JSON body without trusting its shape. */
function readStringField(body: unknown, field: string): string | null {
  if (!body || typeof body !== 'object' || !(field in body)) return null;
  const value = (body as Record<string, unknown>)[field];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

/** Turns the Nest error body into a single readable sentence. */
function messageFromBody(body: unknown): string | null {
  if (!body || typeof body !== 'object') return null;

  if ('message' in body) {
    const message = (body as Record<string, unknown>).message;
    if (typeof message === 'string' && message.trim()) return message.trim();
    if (Array.isArray(message)) {
      const parts = message.filter((part): part is string => typeof part === 'string');
      if (parts.length) return parts.join(' ');
    }
  }

  return readStringField(body, 'error');
}

/** Reads the error body and falls back to the status text when it is not JSON. */
async function readErrorMessage(response: Response): Promise<string> {
  try {
    const body: unknown = await response.json();
    const message = messageFromBody(body);
    if (message) return message;
  } catch {
    // The backend did not answer with JSON, so the status text is all we have.
  }

  return response.statusText || `The transcription request failed (${response.status}).`;
}

/** Reads a successful response body, filling in the optional fields. */
function toTranscriptionResponse(body: unknown): TranscriptionResponse {
  const text = readStringField(body, 'text') ?? '';
  const language = readStringField(body, 'language');
  const provider = readStringField(body, 'provider') ?? 'unknown';

  let durationSeconds: number | null = null;
  if (body && typeof body === 'object' && 'durationSeconds' in body) {
    const value = (body as Record<string, unknown>).durationSeconds;
    if (typeof value === 'number' && Number.isFinite(value)) durationSeconds = value;
  }

  return { text, language, durationSeconds, provider };
}

/**
 * Uploads a recording and returns its transcription.
 *
 * The file is validated locally first: an empty or oversized recording can
 * never succeed, and telling the user right away is cheaper and clearer than
 * a round trip that is bound to fail.
 */
export async function transcribeAudio(
  file: File,
  options?: { language?: string; signal?: AbortSignal },
): Promise<TranscriptionResponse> {
  if (file.size === 0) {
    throw new TranscriptionApiError(0, 'The recording is empty. Record your answer again.');
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    throw new TranscriptionApiError(
      0,
      'The recording is larger than the 25 MB limit. Record a shorter answer.',
    );
  }

  const form = new FormData();
  form.append('file', file);
  if (options?.language) {
    form.append('language', options.language);
  }

  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl()}/api/transcription`, {
      method: 'POST',
      body: form,
      signal: options?.signal,
    });
  } catch (error) {
    // An aborted request is not a failure the user needs to see.
    if (isAbortError(error)) throw error;
    throw new TranscriptionApiError(
      0,
      'Could not reach the transcription service. Check that the backend is running.',
    );
  }

  if (!response.ok) {
    throw new TranscriptionApiError(response.status, await readErrorMessage(response));
  }

  const payload: unknown = await response.json();
  return toTranscriptionResponse(payload);
}

/** Reads the name of the provider the backend is wired up to. */
export async function fetchProvider(): Promise<string> {
  const response = await fetch(`${apiBaseUrl()}/api/transcription/provider`, {
    method: 'GET',
  });

  if (!response.ok) {
    throw new TranscriptionApiError(response.status, await readErrorMessage(response));
  }

  const payload: unknown = await response.json();
  return readStringField(payload, 'provider') ?? 'unknown';
}
