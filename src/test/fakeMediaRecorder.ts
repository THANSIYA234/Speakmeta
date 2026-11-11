import { vi } from 'vitest';

/**
 * Test doubles for the browser media APIs.
 *
 * jsdom implements neither `MediaRecorder` nor `getUserMedia`, so the
 * recorder tests drive a fake that behaves like the real API: it records
 * chunks, reports its state, and fires `onstop` when stopped.
 */

export type FakeRecorderState = 'inactive' | 'recording' | 'paused';

/** The `getUserMedia` mock installed by `installFakeMedia`. */
export type FakeGetUserMedia = ReturnType<typeof vi.fn<() => Promise<MediaStream>>>;

export interface FakeMediaRecorderOptions {
  /** Fails `pause()` the way older iOS Safari does. */
  failOnPause?: boolean;
  /** Produces an empty blob, as happens when the mic is muted. */
  emptyRecording?: boolean;
  /**
   * Rejects the container when a `mimeType` is requested.
   *
   * Some browsers advertise a format and then refuse to build a recorder with
   * it, which is why the recorder falls back to the browser default.
   */
  rejectRequestedMimeType?: boolean;
}

export class FakeMediaRecorder {
  static isTypeSupported(type: string): boolean {
    return type === 'audio/webm;codecs=opus' || type === 'audio/webm';
  }

  static instances: FakeMediaRecorder[] = [];

  /** Every instance created since the last `reset()`, newest last. */
  static reset(): void {
    FakeMediaRecorder.instances = [];
  }

  static get last(): FakeMediaRecorder | undefined {
    return FakeMediaRecorder.instances[FakeMediaRecorder.instances.length - 1];
  }

  state: FakeRecorderState = 'inactive';
  mimeType: string;
  ondataavailable: ((event: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;
  onerror: (() => void) | null = null;

  /** Set when `start()` was called with a timeslice. */
  timeslice: number | undefined;

  private readonly options: FakeMediaRecorderOptions;
  private chunkCount = 0;

  constructor(
    _stream: MediaStream,
    options?: { mimeType?: string },
    testOptions: FakeMediaRecorderOptions = {},
  ) {
    if (testOptions.rejectRequestedMimeType && options?.mimeType) {
      throw new DOMException('Unsupported media type', 'NotSupportedError');
    }
    this.mimeType = options?.mimeType ?? 'audio/webm';
    this.options = testOptions;
    FakeMediaRecorder.instances.push(this);
  }

  start(timeslice?: number): void {
    this.timeslice = timeslice;
    this.state = 'recording';
  }

  pause(): void {
    if (this.options.failOnPause) {
      throw new DOMException('Pause not supported', 'InvalidStateError');
    }
    this.state = 'paused';
  }

  resume(): void {
    this.state = 'recording';
  }

  stop(): void {
    this.state = 'inactive';
    if (!this.options.emptyRecording) {
      this.chunkCount += 1;
      this.ondataavailable?.({
        data: new Blob([new Uint8Array(1024)], { type: this.mimeType }),
      });
    }
    this.onstop?.();
  }
}

/** Installs the fake recorder and a fake microphone on `globalThis`. */
export function installFakeMedia({
  failOnPause = false,
  emptyRecording = false,
  rejectRequestedMimeType = false,
  permission = 'granted',
}: FakeMediaRecorderOptions & { permission?: 'granted' | 'denied' | 'no-device' } = {}): {
  getUserMedia: FakeGetUserMedia;
} {
  FakeMediaRecorder.reset();

  const track = { stop: vi.fn() } as unknown as MediaStreamTrack;
  const stream = { getTracks: () => [track] } as unknown as MediaStream;

  const getUserMedia = vi.fn(async () => {
    if (permission === 'denied') {
      throw new DOMException('Permission denied', 'NotAllowedError');
    }
    if (permission === 'no-device') {
      throw new DOMException('No device', 'NotFoundError');
    }
    return stream;
  });

  Object.defineProperty(globalThis, 'MediaRecorder', {
    writable: true,
    configurable: true,
    value: class extends FakeMediaRecorder {
      constructor(s: MediaStream, o?: { mimeType?: string }) {
        super(s, o, { failOnPause, emptyRecording, rejectRequestedMimeType });
      }
    },
  });

  Object.defineProperty(navigator, 'mediaDevices', {
    writable: true,
    configurable: true,
    value: { getUserMedia },
  });

  // jsdom has no object URL support.
  if (typeof URL.createObjectURL !== 'function') {
    Object.defineProperty(URL, 'createObjectURL', {
      writable: true,
      configurable: true,
      value: vi.fn(() => 'blob:mock/recording'),
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      writable: true,
      configurable: true,
      value: vi.fn(),
    });
  }

  return { getUserMedia };
}

/** Removes the fake media APIs so a test can assert on an unsupported browser. */
export function uninstallFakeMedia(): void {
  Reflect.deleteProperty(globalThis, 'MediaRecorder');
  Reflect.deleteProperty(navigator, 'mediaDevices');
}
