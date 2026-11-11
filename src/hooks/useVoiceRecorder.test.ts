import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { FakeTimersConfig } from 'vitest';

import { useVoiceRecorder } from './useVoiceRecorder';
import { FakeMediaRecorder, installFakeMedia, uninstallFakeMedia } from '../test/fakeMediaRecorder';

/**
 * The hook measures elapsed time with `performance.now()` and drives its
 * display with `setInterval`, so both clocks are faked. Advancing them keeps
 * every timing assertion exact instead of racing a real clock.
 */
const FAKE_TIMERS: FakeTimersConfig = {
  toFake: ['Date', 'performance', 'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'],
};

/**
 * Sets `window.isSecureContext`.
 *
 * jsdom does not implement the property at all, so it is defined here and
 * removed again afterwards. The recorder reads it to tell a page served over
 * plain HTTP apart from a browser that is simply too old.
 */
const setSecureContext = (value: boolean) => {
  Object.defineProperty(window, 'isSecureContext', {
    configurable: true,
    get: () => value,
  });
};

describe('useVoiceRecorder', () => {
  beforeEach(() => {
    vi.useFakeTimers(FAKE_TIMERS);
    installFakeMedia();
  });

  afterEach(() => {
    uninstallFakeMedia();
    vi.useRealTimers();
    Reflect.deleteProperty(window, 'isSecureContext');
  });

  it('starts idle with no recording and no error', () => {
    const { result } = renderHook(() => useVoiceRecorder());

    expect(result.current.status).toBe('idle');
    expect(result.current.recording).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.elapsedMs).toBe(0);
  });

  it('reports the browser as ready when the microphone API is available', () => {
    const { result } = renderHook(() => useVoiceRecorder());

    expect(result.current.support).toBe('ready');
  });

  it('requests the microphone and enters the recording state', async () => {
    const { result } = renderHook(() => useVoiceRecorder());

    await act(async () => {
      await result.current.start();
    });

    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({ audio: true });
    expect(result.current.status).toBe('recording');
    expect(FakeMediaRecorder.last?.timeslice).toBe(1000);
  });

  it('advances the timer while recording', async () => {
    const { result } = renderHook(() => useVoiceRecorder());

    await act(async () => {
      await result.current.start();
    });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    // The display ticks every 100ms, so it lands on the tick boundary.
    expect(result.current.elapsedMs).toBe(300);
  });

  it('pauses without stopping the recorder and resumes again', async () => {
    const { result } = renderHook(() => useVoiceRecorder());

    await act(async () => {
      await result.current.start();
    });

    act(() => {
      result.current.pause();
    });

    expect(result.current.status).toBe('paused');
    expect(FakeMediaRecorder.last?.state).toBe('paused');

    act(() => {
      result.current.resume();
    });

    expect(result.current.status).toBe('recording');
    expect(FakeMediaRecorder.last?.state).toBe('recording');
  });

  it('keeps the elapsed time while paused and continues after resuming', async () => {
    const { result } = renderHook(() => useVoiceRecorder());

    await act(async () => {
      await result.current.start();
    });

    act(() => {
      vi.advanceTimersByTime(120);
    });

    act(() => {
      result.current.pause();
    });

    const pausedAt = result.current.elapsedMs;
    expect(pausedAt).toBe(120);

    act(() => {
      vi.advanceTimersByTime(200);
    });

    // The clock must not advance while paused.
    expect(result.current.elapsedMs).toBe(pausedAt);

    act(() => {
      result.current.resume();
    });

    act(() => {
      vi.advanceTimersByTime(120);
    });

    // The 120ms already recorded is kept, plus the first tick after resuming.
    expect(result.current.elapsedMs).toBe(220);
  });

  it('produces a blob, an object URL and a file name when stopped', async () => {
    const onRecordingComplete = vi.fn();
    const { result } = renderHook(() => useVoiceRecorder({ onRecordingComplete }));

    await act(async () => {
      await result.current.start();
    });

    act(() => {
      vi.advanceTimersByTime(120);
    });

    act(() => {
      result.current.stop();
    });

    expect(result.current.status).toBe('recorded');

    const recording = result.current.recording;
    expect(recording).not.toBeNull();
    expect(recording?.blob).toBeInstanceOf(Blob);
    expect(recording?.blob.size).toBeGreaterThan(0);
    expect(recording?.url).toContain('blob:');
    expect(recording?.durationMs).toBe(120);
    expect(recording?.sizeBytes).toBe(recording?.blob.size);
    expect(recording?.fileName).toMatch(/^speaking-\d+\.webm$/);
    expect(onRecordingComplete).toHaveBeenCalledWith(recording);
  });

  it('keeps the timer running while recording and stops it after stopping', async () => {
    const { result } = renderHook(() => useVoiceRecorder());

    await act(async () => {
      await result.current.start();
    });

    act(() => {
      vi.advanceTimersByTime(120);
    });

    act(() => {
      result.current.stop();
    });

    const frozen = result.current.elapsedMs;
    expect(frozen).toBe(120);

    act(() => {
      vi.advanceTimersByTime(150);
    });

    expect(result.current.elapsedMs).toBe(frozen);
  });

  it('clears the recording and returns to idle on discard', async () => {
    const { result } = renderHook(() => useVoiceRecorder());

    await act(async () => {
      await result.current.start();
    });

    act(() => {
      result.current.stop();
    });

    act(() => {
      result.current.discard();
    });

    expect(result.current.status).toBe('idle');
    expect(result.current.recording).toBeNull();
    expect(result.current.elapsedMs).toBe(0);
    expect(result.current.error).toBeNull();
  });

  it('releases the microphone when the recording is discarded', async () => {
    const { result } = renderHook(() => useVoiceRecorder());

    await act(async () => {
      await result.current.start();
    });

    act(() => {
      result.current.stop();
    });

    act(() => {
      result.current.discard();
    });

    expect(FakeMediaRecorder.last?.state).toBe('inactive');
  });

  it('maps a denied microphone permission to a permission error', async () => {
    installFakeMedia({ permission: 'denied' });
    const onError = vi.fn();
    const { result } = renderHook(() => useVoiceRecorder({ onError }));

    await act(async () => {
      await result.current.start();
    });

    expect(result.current.status).toBe('error');
    expect(result.current.error?.code).toBe('permission-denied');
    expect(result.current.error?.message).toMatch(/microphone/i);
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ code: 'permission-denied' }));
  });

  it('maps a missing microphone to a no-device error', async () => {
    installFakeMedia({ permission: 'no-device' });
    const { result } = renderHook(() => useVoiceRecorder());

    await act(async () => {
      await result.current.start();
    });

    expect(result.current.status).toBe('error');
    expect(result.current.error?.code).toBe('no-device');
  });

  it('reports an error when no audio was captured', async () => {
    installFakeMedia({ emptyRecording: true });
    const { result } = renderHook(() => useVoiceRecorder());

    await act(async () => {
      await result.current.start();
    });

    act(() => {
      result.current.stop();
    });

    expect(result.current.status).toBe('error');
    expect(result.current.error?.code).toBe('recording-failed');
    expect(result.current.error?.message).toMatch(/no audio/i);
  });

  it('keeps recording when the browser refuses to pause', async () => {
    installFakeMedia({ failOnPause: true });
    const { result } = renderHook(() => useVoiceRecorder());

    await act(async () => {
      await result.current.start();
    });

    act(() => {
      result.current.pause();
    });

    // The take must survive a failed pause.
    expect(result.current.status).toBe('recording');
    expect(result.current.error).toBeNull();
    expect(result.current.canPause).toBe(false);
  });

  it('falls back to the browser default when the requested container is rejected', async () => {
    installFakeMedia({ rejectRequestedMimeType: true });
    const { result } = renderHook(() => useVoiceRecorder());

    await act(async () => {
      await result.current.start();
    });

    // The recording must still work with the browser's own container.
    expect(result.current.status).toBe('recording');

    act(() => {
      result.current.stop();
    });

    expect(result.current.status).toBe('recorded');
    expect(result.current.recording?.blob.size).toBeGreaterThan(0);
    expect(result.current.recording?.mimeType).toBe('audio/webm');
  });

  it('ignores a second start while already recording', async () => {
    const { result } = renderHook(() => useVoiceRecorder());

    await act(async () => {
      await result.current.start();
    });

    await act(async () => {
      await result.current.start();
    });

    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledTimes(1);
  });

  it('reports an insecure context when the page is served over plain HTTP', () => {
    // Chrome exposes `navigator.mediaDevices` over plain HTTP but rejects
    // `getUserMedia` there, so the secure context has to be checked first.
    setSecureContext(false);

    const { result } = renderHook(() => useVoiceRecorder());

    expect(result.current.support).toBe('insecure-context');
  });

  it('refuses to record over plain HTTP instead of blaming the permission', async () => {
    setSecureContext(false);

    const { result } = renderHook(() => useVoiceRecorder());

    await act(async () => {
      await result.current.start();
    });

    expect(navigator.mediaDevices.getUserMedia).not.toHaveBeenCalled();
    expect(result.current.status).toBe('error');
    expect(result.current.error?.code).toBe('insecure-context');
    expect(result.current.error?.message).toMatch(/secure connection/i);
  });

  it('stops the recorder when the component unmounts', async () => {
    const { result, unmount } = renderHook(() => useVoiceRecorder());

    await act(async () => {
      await result.current.start();
    });

    const recorder = FakeMediaRecorder.last;
    unmount();

    expect(recorder?.state).toBe('inactive');
  });
});
