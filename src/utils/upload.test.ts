import { describe, expect, it } from 'vitest';

import {
  baseMimeType,
  buildRecordingFileName,
  extensionForMimeType,
  toUploadPayload,
} from './upload';
import type { VoiceRecording } from '../types';

function makeRecording(overrides: Partial<VoiceRecording> = {}): VoiceRecording {
  const blob = new Blob([new Uint8Array(2048)], { type: 'audio/webm;codecs=opus' });
  return {
    blob,
    url: 'blob:mock/recording',
    mimeType: 'audio/webm;codecs=opus',
    durationMs: 4200,
    sizeBytes: blob.size,
    fileName: 'speaking-1700000000000.webm',
    ...overrides,
  };
}

describe('baseMimeType', () => {
  it('strips the codec parameters', () => {
    expect(baseMimeType('audio/webm;codecs=opus')).toBe('audio/webm');
  });

  it('lowercases the type', () => {
    expect(baseMimeType('AUDIO/MP4')).toBe('audio/mp4');
  });

  it('leaves a bare type untouched', () => {
    expect(baseMimeType('audio/mp4')).toBe('audio/mp4');
  });
});

describe('extensionForMimeType', () => {
  it('maps webm to webm', () => {
    expect(extensionForMimeType('audio/webm;codecs=opus')).toBe('webm');
  });

  it('maps mp4 to m4a, the extension Safari recordings use', () => {
    expect(extensionForMimeType('audio/mp4')).toBe('m4a');
  });

  it('maps ogg to ogg', () => {
    expect(extensionForMimeType('audio/ogg;codecs=opus')).toBe('ogg');
  });

  it('falls back to webm for an unknown container', () => {
    expect(extensionForMimeType('audio/unknown')).toBe('webm');
  });
});

describe('buildRecordingFileName', () => {
  it('builds a name with the extension that matches the container', () => {
    expect(buildRecordingFileName('audio/webm;codecs=opus', 1700000000000)).toBe(
      'speaking-1700000000000.webm',
    );
  });

  it('uses the m4a extension for mp4 recordings', () => {
    expect(buildRecordingFileName('audio/mp4', 1700000000000)).toBe(
      'speaking-1700000000000.m4a',
    );
  });
});

describe('toUploadPayload', () => {
  it('produces a file with the recorded name and the bare mime type', () => {
    const payload = toUploadPayload(makeRecording());

    expect(payload.file).toBeInstanceOf(File);
    expect(payload.file.name).toBe('speaking-1700000000000.webm');
    expect(payload.file.type).toBe('audio/webm');
  });

  it('carries the audio bytes over unchanged', async () => {
    const recording = makeRecording();
    const payload = toUploadPayload(recording);

    const bytes = new Uint8Array(await payload.file.arrayBuffer());
    expect(bytes.byteLength).toBe(recording.sizeBytes);
  });

  it('reports the duration and the size', () => {
    const payload = toUploadPayload(makeRecording());

    expect(payload.durationMs).toBe(4200);
    expect(payload.sizeBytes).toBe(2048);
    expect(payload.mimeType).toBe('audio/webm');
  });

  it('keeps the audio in a single file, ready for the upload endpoint', () => {
    // The multipart field name has to match the backend contract, which does
    // not exist yet, so the `File` is the contract for now.
    const payload = toUploadPayload(makeRecording());

    expect(payload.file.size).toBe(2048);
  });
});
