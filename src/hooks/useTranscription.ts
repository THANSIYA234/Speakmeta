import { useCallback, useEffect, useRef, useState } from 'react';

import { isAbortError, transcribeAudio } from '../api/transcription';

/** Lifecycle of a transcription request. */
export type TranscriptionStatus = 'idle' | 'uploading' | 'success' | 'error';

export interface UseTranscriptionResult {
  status: TranscriptionStatus;
  /** The raw text the provider returned. The caller owns the editable copy. */
  text: string;
  error: string | null;
  transcribe: (file: File, language?: string) => Promise<void>;
  reset: () => void;
  isUploading: boolean;
}

/**
 * Owns the lifecycle of a speech-to-text request.
 *
 * Only one request runs at a time: starting a new one aborts the previous
 * call, so a slow answer from an earlier recording can never overwrite the
 * result of a later one.
 */
export function useTranscription(): UseTranscriptionResult {
  const [status, setStatus] = useState<TranscriptionStatus>('idle');
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const controllerRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);

  // A request that is still running when the screen goes away is cancelled so
  // it cannot set state on an unmounted component.
  useEffect(() => {
    return () => {
      controllerRef.current?.abort();
      controllerRef.current = null;
    };
  }, []);

  const reset = useCallback(() => {
    requestIdRef.current += 1;
    controllerRef.current?.abort();
    controllerRef.current = null;
    setStatus('idle');
    setText('');
    setError(null);
  }, []);

  const transcribe = useCallback(async (file: File, language?: string) => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    setStatus('uploading');
    setError(null);
    setText('');

    try {
      const result = await transcribeAudio(file, { language, signal: controller.signal });
      if (requestIdRef.current !== requestId) return;
      setText(result.text);
      setStatus('success');
    } catch (cause) {
      if (requestIdRef.current !== requestId) return;
      // An aborted request is a deliberate cancellation, not a failure.
      if (isAbortError(cause)) return;
      setError(cause instanceof Error ? cause.message : 'The transcription failed. Try again.');
      setStatus('error');
    } finally {
      if (controllerRef.current === controller) {
        controllerRef.current = null;
      }
    }
  }, []);

  return {
    status,
    text,
    error,
    transcribe,
    reset,
    isUploading: status === 'uploading',
  };
}

export default useTranscription;
