import type { VoiceRecording } from '../types';

/**
 * File extension per container.
 *
 * The recorder reports the container it produced (`audio/webm`, `audio/mp4`,
 * `audio/ogg`). Safari records MP4, Chrome and Firefox record WebM, so the
 * extension has to follow the container rather than being hard-coded.
 */
const EXTENSION_BY_MIME: Record<string, string> = {
  'audio/webm': 'webm',
  'audio/mp4': 'm4a',
  'audio/ogg': 'ogg',
  'audio/mpeg': 'mp3',
  'audio/wav': 'wav',
};

/**
 * Strips the codec parameters from a MIME type.
 *
 * `MediaRecorder` reports `audio/webm;codecs=opus`. That is a valid MIME type
 * for the recorder, but a server that stores the blob under that string ends
 * up with an unusable file extension, so the bare type is kept separately.
 */
export function baseMimeType(mimeType: string): string {
  return mimeType.split(';')[0].trim().toLowerCase();
}

/** Returns the file extension that matches the recorded container. */
export function extensionForMimeType(mimeType: string): string {
  return EXTENSION_BY_MIME[baseMimeType(mimeType)] ?? 'webm';
}

/**
 * Builds the name the recording gets when it is uploaded.
 *
 * The timestamp keeps repeated takes of the same prompt from overwriting each
 * other on the server.
 */
export function buildRecordingFileName(mimeType: string, timestamp: number = Date.now()): string {
  return `speaking-${timestamp}.${extensionForMimeType(mimeType)}`;
}

/** Everything the backend will need for a single recording. */
export interface AudioUploadPayload {
  file: File;
  fileName: string;
  mimeType: string;
  durationMs: number;
  sizeBytes: number;
}

/**
 * Turns a finished recording into a `File` that is ready to upload.
 *
 * The audio never leaves the device in this phase, so this only wraps the
 * existing blob. No bytes are copied: `File` keeps a reference to the blob's
 * data.
 */
export function toUploadPayload(recording: VoiceRecording): AudioUploadPayload {
  const file = new File([recording.blob], recording.fileName, {
    type: baseMimeType(recording.mimeType),
  });

  return {
    file,
    fileName: recording.fileName,
    mimeType: baseMimeType(recording.mimeType),
    durationMs: recording.durationMs,
    sizeBytes: recording.sizeBytes,
  };
}
