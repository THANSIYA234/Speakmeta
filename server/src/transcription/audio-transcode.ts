/**
 * Audio conversion for providers that reject the browser's containers.
 *
 * `MediaRecorder` produces WebM/Opus on Chrome and Firefox and MP4/AAC on
 * Safari. MiniMax's ASR endpoint accepts neither, so the upload is converted
 * to MP3 before it is sent: mono, 16 kHz, 32 kbps, which is what the service
 * documents as the ideal input and keeps the payload small.
 *
 * The conversion runs through `ffmpeg`, which has to be installed on the host
 * running the API. The configuration refuses to boot without it when the
 * MiniMax provider is selected.
 */
import { spawn } from 'node:child_process';

export interface TranscodeOptions {
  /** Path or name of the ffmpeg binary. */
  ffmpegPath: string;
  /** How long the conversion may take before it is killed. */
  timeoutMs: number;
}

/** Containers MiniMax's ASR endpoint accepts without conversion. */
export const MINIMAX_ACCEPTED_MIME_TYPES = [
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-wav',
  'audio/wave',
  'audio/flac',
  'audio/ogg',
  'audio/aac',
] as const;

/**
 * Whether the upload has to be converted before it goes to MiniMax.
 *
 * WebM and MP4/M4A are what the browsers record, and neither is on the
 * accepted list.
 */
export function needsTranscode(mimeType: string): boolean {
  const type = mimeType.split(';')[0].trim().toLowerCase();
  return !(MINIMAX_ACCEPTED_MIME_TYPES as readonly string[]).includes(type);
}

/** Replaces the extension of a file name, e.g. `speaking-1.webm` -> `speaking-1.mp3`. */
export function withExtension(fileName: string, extension: string): string {
  const stem = fileName.replace(/\.[^./\\]+$/, '') || 'recording';
  return `${stem}${extension}`;
}

/**
 * Converts the audio to mono 16 kHz MP3.
 *
 * ffmpeg reads the buffer from stdin and writes the MP3 to stdout, so no
 * temporary file is created and nothing is left behind on disk.
 */
export function transcodeToMp3(audio: Buffer, options: TranscodeOptions): Promise<Buffer> {
  const { promise, resolve, reject } = Promise.withResolvers<Buffer>();

  const child = spawn(
    options.ffmpegPath,
    [
      '-hide_banner',
      '-loglevel',
      'error',
      '-i',
      'pipe:0',
      '-vn',
      '-ar',
      '16000',
      '-ac',
      '1',
      '-b:a',
      '32k',
      '-c:a',
      'libmp3lame',
      '-f',
      'mp3',
      'pipe:1',
    ],
    { stdio: ['pipe', 'pipe', 'pipe'] },
  );

  const chunks: Buffer[] = [];
  let stderr = '';
  let settled = false;

  const settle = (action: () => void): void => {
    if (settled) return;
    settled = true;
    action();
  };

  const timer = setTimeout(() => {
    child.kill('SIGKILL');
    settle(() => reject(new Error('Audio conversion timed out.')));
  }, options.timeoutMs);

  child.stdout.on('data', (chunk: Buffer) => chunks.push(chunk));
  child.stderr.on('data', (chunk: Buffer) => {
    stderr += chunk.toString('utf8');
  });

  child.on('error', (error: NodeJS.ErrnoException) => {
    clearTimeout(timer);
    settle(() => {
      if (error.code === 'ENOENT') {
        reject(new Error(`ffmpeg was not found at "${options.ffmpegPath}".`));
        return;
      }
      reject(new Error(`Audio conversion failed: ${error.message}`));
    });
  });

  child.on('close', (code) => {
    clearTimeout(timer);
    settle(() => {
      if (code !== 0) {
        reject(new Error(`Audio conversion failed (ffmpeg exit ${code}): ${stderr.slice(0, 300)}`));
        return;
      }
      resolve(Buffer.concat(chunks));
    });
  });

  // ffmpeg can close stdin before the whole buffer is written; the error is
  // reported through the exit code instead.
  child.stdin.on('error', () => undefined);
  child.stdin.end(audio);

  return promise;
}
