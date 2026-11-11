import { useCallback, useEffect, useRef, useState } from 'react';

import type { RecorderError, RecorderStatus, RecorderSupport, VoiceRecording } from '../types';
import { buildRecordingFileName } from '../utils/upload';

/**
 * Formats we try to record with, best first.
 *
 * Chrome and Firefox produce WebM/Opus, iOS Safari produces MP4. We ask the
 * browser which of these it can actually record instead of assuming one.
 */
const MIME_CANDIDATES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/mp4',
  'audio/ogg;codecs=opus',
];

const TIMER_INTERVAL_MS = 100;

function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === 'undefined') return undefined;
  // `isTypeSupported` is missing on very old Safari, and a browser without it
  // still records fine with whatever format it prefers.
  if (typeof MediaRecorder.isTypeSupported !== 'function') return undefined;
  return MIME_CANDIDATES.find((type) => MediaRecorder.isTypeSupported(type));
}

/**
 * Works out what this browser can do before the user touches the microphone.
 *
 * The distinction matters: an old browser needs an upgrade, while a page
 * served over plain HTTP needs to be moved to HTTPS. Telling someone to
 * upgrade Chrome when their real problem is the URL is a dead end.
 *
 * `window.isSecureContext` is the primary signal: `false` means the page is
 * on plain HTTP, and the microphone has to be moved behind HTTPS. Only when
 * the context is secure does the presence of `MediaRecorder` and
 * `navigator.mediaDevices` decide between "ready" and "browser too old".
 */
function detectSupport(): RecorderSupport {
  if (typeof window === 'undefined') {
    return 'unsupported';
  }

  /*
   * The secure context is checked before the microphone API is looked for.
   * Chrome exposes `navigator.mediaDevices` over plain HTTP as well, but
   * `getUserMedia` always rejects there. Without this check the rejection is
   * mistaken for a blocked permission, and the user is sent to the browser
   * permission settings instead of being told to serve the app over https.
   */
  if (window.isSecureContext === false) {
    return 'insecure-context';
  }

  if (typeof MediaRecorder === 'undefined') {
    return 'unsupported';
  }

  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    return 'unsupported';
  }

  return 'ready';
}

function toRecorderError(error: unknown): RecorderError {
  if (error instanceof DOMException) {
    switch (error.name) {
      case 'NotAllowedError':
      case 'PermissionDeniedError':
        return {
          code: 'permission-denied',
          message:
            'Microphone access was blocked. Allow the microphone for this site in your browser settings and try again.',
        };
      case 'NotFoundError':
      case 'DevicesNotFoundError':
        return {
          code: 'no-device',
          message: 'No microphone was found on this device.',
        };
      case 'NotReadableError':
      case 'AbortError':
        return {
          code: 'recording-failed',
          message: 'The microphone is busy. Close other apps that may be using it and try again.',
        };
      case 'SecurityError':
        return {
          code: 'insecure-context',
          message: 'Microphone access needs a secure connection (https or localhost).',
        };
      default:
        break;
    }
  }

  return {
    code: 'recording-failed',
    message: 'Recording could not start. Please try again.',
  };
}

export interface UseVoiceRecorderOptions {
  onRecordingComplete?: (recording: VoiceRecording) => void;
  onError?: (error: RecorderError) => void;
}

export interface UseVoiceRecorderResult {
  status: RecorderStatus;
  error: RecorderError | null;
  recording: VoiceRecording | null;
  elapsedMs: number;
  /** What this browser can do: record, needs HTTPS, or has no recorder. */
  support: RecorderSupport;
  /** False when the browser cannot pause a recording. */
  canPause: boolean;
  start: () => Promise<void>;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  discard: () => void;
}

/**
 * Wraps the browser `MediaRecorder` API.
 *
 * The audio never leaves the device: the finished recording is kept as a `Blob`
 * plus an object URL for playback, ready to be uploaded once the backend exists.
 */
export function useVoiceRecorder({
  onRecordingComplete,
  onError,
}: UseVoiceRecorderOptions = {}): UseVoiceRecorderResult {
  const [status, setStatus] = useState<RecorderStatus>('idle');
  const [error, setError] = useState<RecorderError | null>(null);
  const [recording, setRecording] = useState<VoiceRecording | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  /**
   * False once the browser has told us it cannot pause a recording.
   *
   * Some mobile browsers implement the method but reject the call, so this
   * starts optimistic and is corrected on first use.
   */
  const [canPause, setCanPause] = useState(true);

  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const urlRef = useRef<string | null>(null);
  /** Milliseconds already captured before the currently running segment. */
  const accumulatedRef = useRef(0);
  /** `performance.now()` when the current segment started. */
  const segmentStartRef = useRef(0);
  /** True while the clock should keep advancing. */
  const runningRef = useRef(false);

  const completeRef = useRef(onRecordingComplete);
  const errorRef = useRef(onError);

  useEffect(() => {
    completeRef.current = onRecordingComplete;
    errorRef.current = onError;
  }, [onRecordingComplete, onError]);

  // Resolved once per mount: the capabilities of the browser do not change
  // while the page is open, and re-detecting on every render is wasted work.
  const [support] = useState<RecorderSupport>(detectSupport);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    recorderRef.current = null;
  }, []);

  const releaseUrl = useCallback(() => {
    if (urlRef.current !== null) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
  }, []);

  const elapsedNow = useCallback(
    () =>
      accumulatedRef.current +
      (runningRef.current ? performance.now() - segmentStartRef.current : 0),
    [],
  );

  const startTimer = useCallback(() => {
    clearTimer();
    timerRef.current = window.setInterval(() => {
      setElapsedMs(elapsedNow());
    }, TIMER_INTERVAL_MS);
  }, [clearTimer, elapsedNow]);

  const fail = useCallback((nextError: RecorderError) => {
    setError(nextError);
    setStatus('error');
    clearTimer();
    runningRef.current = false;
    stopStream();
    errorRef.current?.(nextError);
  }, [clearTimer, stopStream]);

  const discard = useCallback(() => {
    clearTimer();
    stopStream();
    releaseUrl();
    chunksRef.current = [];
    accumulatedRef.current = 0;
    segmentStartRef.current = 0;
    runningRef.current = false;
    setRecording(null);
    setElapsedMs(0);
    setError(null);
    setStatus('idle');
  }, [clearTimer, releaseUrl, stopStream]);

  const start = useCallback(async () => {
    if (status === 'requesting' || status === 'recording' || status === 'paused') {
      return;
    }

    if (support === 'unsupported') {
      fail({
        code: 'unsupported',
        message: 'This browser cannot record audio. Try a recent version of Chrome or Safari.',
      });
      return;
    }

    if (support === 'insecure-context') {
      fail({
        code: 'insecure-context',
        message:
          'Microphone access needs a secure connection (https or localhost). Open the app over https and try again.',
      });
      return;
    }

    // Starting over replaces the previous take, so release its URL first.
    releaseUrl();
    setRecording(null);
    setError(null);
    setStatus('requesting');

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      fail(toRecorderError(err));
      return;
    }

    const mimeType = pickMimeType();
    let recorder: MediaRecorder;
    let usedMimeType = mimeType;
    try {
      recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
    } catch {
      /*
       * A browser can advertise a container and still refuse to build a
       * recorder with it. Safari versions disagree about which MP4 variants
       * they accept, so fall back to the browser's own default rather than
       * failing the recording outright.
       */
      try {
        recorder = new MediaRecorder(stream);
        usedMimeType = undefined;
      } catch {
        stream.getTracks().forEach((track) => track.stop());
        fail({
          code: 'unsupported',
          message: 'This browser cannot record audio in a supported format.',
        });
        return;
      }
    }

    streamRef.current = stream;
    recorderRef.current = recorder;
    chunksRef.current = [];
    accumulatedRef.current = 0;
    segmentStartRef.current = performance.now();
    runningRef.current = true;
    setElapsedMs(0);

    recorder.ondataavailable = (event: BlobEvent) => {
      if (event.data && event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    recorder.onerror = () => {
      fail({
        code: 'recording-failed',
        message: 'The recording stopped unexpectedly. Please try again.',
      });
    };

    recorder.onstop = () => {
      clearTimer();
      stopStream();

      // The recorder reports the container it actually produced, which can
      // differ from the one that was requested.
      const type = recorder.mimeType || usedMimeType || 'audio/webm';
      const blob = new Blob(chunksRef.current, { type });
      chunksRef.current = [];

      if (blob.size === 0) {
        fail({
          code: 'recording-failed',
          message: 'No audio was captured. Check your microphone and try again.',
        });
        return;
      }

      const durationMs = Math.max(0, Math.round(elapsedNow()));
      const url = URL.createObjectURL(blob);
      urlRef.current = url;

      const nextRecording: VoiceRecording = {
        blob,
        url,
        mimeType: type,
        durationMs,
        sizeBytes: blob.size,
        fileName: buildRecordingFileName(type),
      };

      setRecording(nextRecording);
      setElapsedMs(durationMs);
      setStatus('recorded');
      completeRef.current?.(nextRecording);
    };

    // A timeslice flushes chunks while recording so a long take cannot grow
    // unbounded in memory. Browsers that dislike it simply ignore the argument.
    try {
      recorder.start(1000);
    } catch {
      recorder.start();
    }

    setStatus('recording');
    startTimer();
  }, [
    clearTimer,
    elapsedNow,
    fail,
    releaseUrl,
    startTimer,
    status,
    stopStream,
    support,
  ]);

  const pause = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state !== 'recording') return;

    // Older iOS Safari exposes `pause()` but throws when it is called.
    // Losing the whole take because a convenience button is unavailable
    // would be a poor trade, so a failed pause only disables the button.
    try {
      recorder.pause();
    } catch {
      setCanPause(false);
      return;
    }

    accumulatedRef.current = accumulatedRef.current + (performance.now() - segmentStartRef.current);
    segmentStartRef.current = 0;
    runningRef.current = false;

    setElapsedMs(accumulatedRef.current);
    setStatus('paused');
  }, []);

  const resume = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state !== 'paused') return;

    try {
      recorder.resume();
    } catch {
      setCanPause(false);
      return;
    }

    segmentStartRef.current = performance.now();
    runningRef.current = true;
    setStatus('recording');
    startTimer();
  }, [startTimer]);

  const stop = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === 'inactive') return;

    // Freeze the timer before the recorder fires its final `onstop`.
    if (runningRef.current) {
      accumulatedRef.current += performance.now() - segmentStartRef.current;
    }
    segmentStartRef.current = 0;
    runningRef.current = false;
    clearTimer();

    try {
      recorder.stop();
    } catch {
      fail({
        code: 'recording-failed',
        message: 'The recording could not be stopped cleanly. Please try again.',
      });
    }
  }, [clearTimer, fail]);

  // Release the microphone and the object URL when the screen goes away.
  useEffect(
    () => () => {
      clearTimer();
      const recorder = recorderRef.current;
      if (recorder && recorder.state !== 'inactive') {
        recorder.onstop = null;
        recorder.ondataavailable = null;
        recorder.onerror = null;
        try {
          recorder.stop();
        } catch {
          // The recorder is already gone; nothing to clean up.
        }
      }
      stopStream();
      releaseUrl();
    },
    [clearTimer, releaseUrl, stopStream],
  );

  return {
    status,
    error,
    recording,
    elapsedMs,
    support,
    canPause,
    start,
    pause,
    resume,
    stop,
    discard,
  };
}

export default useVoiceRecorder;
