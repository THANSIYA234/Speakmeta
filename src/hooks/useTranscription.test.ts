import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useTranscription } from './useTranscription';

const jsonResponse = (body: unknown, status = 200): Response =>
  ({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    json: async () => body,
  }) as Response;

const audioFile = (): File =>
  new File([new Uint8Array(128)], 'speaking-1.webm', { type: 'audio/webm' });

describe('useTranscription', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('starts idle', () => {
    const { result } = renderHook(() => useTranscription());

    expect(result.current.status).toBe('idle');
    expect(result.current.text).toBe('');
    expect(result.current.error).toBeNull();
    expect(result.current.isUploading).toBe(false);
  });

  it('reports the upload and then the transcription', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse({ text: 'Hello there', provider: 'mock' })),
    );

    const { result } = renderHook(() => useTranscription());

    await act(async () => {
      await result.current.transcribe(audioFile());
    });

    expect(result.current.status).toBe('success');
    expect(result.current.text).toBe('Hello there');
    expect(result.current.error).toBeNull();
  });

  it('surfaces the error message of a failed request', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse({ message: 'Unsupported file type' }, 400)),
    );

    const { result } = renderHook(() => useTranscription());

    await act(async () => {
      await result.current.transcribe(audioFile());
    });

    expect(result.current.status).toBe('error');
    expect(result.current.error).toBe('Unsupported file type');
  });

  it('clears the previous result when a new upload starts', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse({ text: 'First take', provider: 'mock' })),
    );

    const { result } = renderHook(() => useTranscription());

    await act(async () => {
      await result.current.transcribe(audioFile());
    });
    expect(result.current.text).toBe('First take');

    const second = Promise.withResolvers<Response>();
    vi.stubGlobal('fetch', vi.fn(() => second.promise));

    await act(async () => {
      void result.current.transcribe(audioFile());
    });

    expect(result.current.status).toBe('uploading');
    expect(result.current.text).toBe('');

    await act(async () => {
      second.resolve(jsonResponse({ text: 'Second take', provider: 'mock' }));
    });

    await waitFor(() => expect(result.current.text).toBe('Second take'));
  });

  it('resets back to the idle state', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse({ text: 'Hello there', provider: 'mock' })),
    );

    const { result } = renderHook(() => useTranscription());

    await act(async () => {
      await result.current.transcribe(audioFile());
    });

    act(() => {
      result.current.reset();
    });

    expect(result.current.status).toBe('idle');
    expect(result.current.text).toBe('');
    expect(result.current.error).toBeNull();
  });

  it('aborts the running request when the component unmounts', async () => {
    const abortSpy = vi.fn();
    const pending = Promise.withResolvers<Response>();
    vi.stubGlobal(
      'fetch',
      vi.fn((_url: string, init?: RequestInit) => {
        init?.signal?.addEventListener('abort', abortSpy);
        return pending.promise;
      }),
    );

    const { result, unmount } = renderHook(() => useTranscription());

    act(() => {
      void result.current.transcribe(audioFile());
    });

    unmount();

    expect(abortSpy).toHaveBeenCalled();
  });
});
