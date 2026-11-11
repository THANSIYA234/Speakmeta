import { afterEach, describe, expect, it, vi } from 'vitest';

import { MAX_UPLOAD_BYTES, TranscriptionApiError, transcribeAudio } from './transcription';

const jsonResponse = (body: unknown, status = 200): Response =>
  ({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    json: async () => body,
  }) as Response;

const audioFile = (bytes = 128): File =>
  new File([new Uint8Array(bytes)], 'speaking-1.webm', { type: 'audio/webm' });

describe('transcribeAudio', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('rejects an empty recording without calling the backend', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const empty = new File([], 'silence.webm', { type: 'audio/webm' });

    await expect(transcribeAudio(empty)).rejects.toBeInstanceOf(TranscriptionApiError);
    await expect(transcribeAudio(empty)).rejects.toThrow(/empty/i);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects a recording above the size limit without calling the backend', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const oversized = new File([new Uint8Array(8)], 'huge.webm', { type: 'audio/webm' });
    Object.defineProperty(oversized, 'size', { value: MAX_UPLOAD_BYTES + 1 });

    await expect(transcribeAudio(oversized)).rejects.toThrow(/25 MB/i);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('uploads the file under the "file" field and returns the transcription', async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({ text: 'Hello there', language: 'en', durationSeconds: 2, provider: 'mock' }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const file = audioFile();
    const result = await transcribeAudio(file);

    expect(result).toEqual({
      text: 'Hello there',
      language: 'en',
      durationSeconds: 2,
      provider: 'mock',
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, request] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(request.method).toBe('POST');
    const body = request.body as FormData;
    expect(body.get('file')).toBe(file);
  });

  it('surfaces the message the backend sent', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse({ statusCode: 400, message: 'Unsupported file type', error: 'Bad Request' }, 400)),
    );

    await expect(transcribeAudio(audioFile())).rejects.toThrow('Unsupported file type');
  });

  it('joins the message list the backend sent for validation errors', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse({ statusCode: 400, message: ['file is required', 'type is invalid'] }, 400)),
    );

    await expect(transcribeAudio(audioFile())).rejects.toThrow('file is required type is invalid');
  });

  it('reports an unreachable backend', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('Failed to fetch');
      }),
    );

    await expect(transcribeAudio(audioFile())).rejects.toThrow(/backend is running/i);
  });
});
