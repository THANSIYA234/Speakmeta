import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { FakeTimersConfig } from 'vitest';

import VoiceRecorder from './VoiceRecorder';
import { installFakeMedia, uninstallFakeMedia } from '../test/fakeMediaRecorder';

/**
 * The recorder measures elapsed time with `performance.now()`, so the clock is
 * faked here. The fake `MediaRecorder` delivers its chunks and its `onstop`
 * callback synchronously, and `fireEvent` dispatches synchronously too, which
 * keeps every assertion exact instead of racing a real clock.
 */
const FAKE_TIMERS: FakeTimersConfig = {
  toFake: ['Date', 'performance', 'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'],
};

describe('VoiceRecorder', () => {
  beforeEach(() => {
    vi.useFakeTimers(FAKE_TIMERS);
    installFakeMedia();
  });

  afterEach(() => {
    uninstallFakeMedia();
    vi.useRealTimers();
    Reflect.deleteProperty(window, 'isSecureContext');
  });

  /** Lets the pending `getUserMedia` promise settle and React flush. */
  const flush = async () => {
    await act(async () => {
      await Promise.resolve();
    });
  };

  const clickButton = (name: string) => {
    fireEvent.click(screen.getByRole('button', { name }));
  };

  it('shows an idle status and a zeroed timer before recording', () => {
    render(<VoiceRecorder />);

    expect(screen.getByText('Ready to record')).toBeInTheDocument();
    expect(screen.getByText('00:00')).toBeInTheDocument();
  });

  it('starts recording and shows the recording status', async () => {
    render(<VoiceRecorder />);

    clickButton('Start Recording');
    await flush();

    expect(screen.getByText('Recording')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Stop Recording' })).toBeInTheDocument();
  });

  it('pauses and resumes the recording', async () => {
    render(<VoiceRecorder />);

    clickButton('Start Recording');
    await flush();
    expect(screen.getByText('Recording')).toBeInTheDocument();

    clickButton('Pause');
    expect(screen.getByText('Paused')).toBeInTheDocument();

    clickButton('Resume');
    expect(screen.getByText('Recording')).toBeInTheDocument();
  });

  it('shows a playback control and the recording details when stopped', async () => {
    render(<VoiceRecorder />);

    clickButton('Start Recording');
    await flush();

    clickButton('Stop Recording');

    expect(screen.getByText('Recording ready')).toBeInTheDocument();
    expect(screen.getByLabelText('Recorded audio playback')).toBeInTheDocument();
    expect(screen.getByText('audio/webm;codecs=opus')).toBeInTheDocument();
    expect(screen.getByText(/Saved as speaking-\d+\.webm/)).toBeInTheDocument();
  });

  it('hands the finished recording to the caller', async () => {
    const onRecordingComplete = vi.fn();
    render(<VoiceRecorder onRecordingComplete={onRecordingComplete} />);

    clickButton('Start Recording');
    await flush();

    clickButton('Stop Recording');

    expect(onRecordingComplete).toHaveBeenCalledTimes(1);
    const recording = onRecordingComplete.mock.calls[0][0];
    expect(recording.blob).toBeInstanceOf(Blob);
    expect(recording.fileName).toMatch(/^speaking-\d+\.webm$/);
  });

  it('deletes the recording and returns to the idle state', async () => {
    const onReset = vi.fn();
    render(<VoiceRecorder onReset={onReset} />);

    clickButton('Start Recording');
    await flush();

    clickButton('Stop Recording');
    expect(screen.getByText('Recording ready')).toBeInTheDocument();

    clickButton('Delete');

    expect(screen.getByText('Ready to record')).toBeInTheDocument();
    expect(screen.queryByLabelText('Recorded audio playback')).not.toBeInTheDocument();
    expect(onReset).toHaveBeenCalled();
  });

  it('records again after a take has been deleted', async () => {
    render(<VoiceRecorder />);

    clickButton('Start Recording');
    await flush();

    clickButton('Stop Recording');
    expect(screen.getByText('Recording ready')).toBeInTheDocument();

    clickButton('Record again');
    await flush();

    expect(screen.getByText('Recording')).toBeInTheDocument();
  });

  it('shows a helpful message when the microphone permission is denied', async () => {
    installFakeMedia({ permission: 'denied' });
    render(<VoiceRecorder />);

    clickButton('Start Recording');
    await flush();

    expect(screen.getByText(/Microphone access was blocked/i)).toBeInTheDocument();
    expect(screen.getByText('Recording failed')).toBeInTheDocument();
  });

  it('warns when the browser cannot record audio at all', () => {
    uninstallFakeMedia();
    render(<VoiceRecorder />);

    expect(screen.getByText(/This browser cannot record audio/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Start Recording' })).toBeDisabled();
  });

  it('warns that the microphone needs a secure connection on plain HTTP', () => {
    // jsdom does not implement `isSecureContext`, so it is defined here.
    Object.defineProperty(window, 'isSecureContext', {
      configurable: true,
      get: () => false,
    });

    render(<VoiceRecorder />);

    expect(screen.getByText(/Microphone access needs a secure connection/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Start Recording' })).toBeDisabled();
  });

  it('hides the pause control when the browser refuses to pause', async () => {
    installFakeMedia({ failOnPause: true });
    render(<VoiceRecorder />);

    clickButton('Start Recording');
    await flush();

    // The first attempt reveals that pausing is unavailable, and the control
    // disappears rather than failing the take.
    clickButton('Pause');

    expect(screen.queryByRole('button', { name: 'Pause' })).not.toBeInTheDocument();
    expect(screen.getByText('Recording')).toBeInTheDocument();
  });
});
