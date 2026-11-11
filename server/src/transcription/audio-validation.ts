/**
 * Upload validation.
 *
 * The browser tells us the MIME type, but a client can tell us anything, so
 * the file is also sniffed for a known audio container signature. Both checks
 * have to pass: a file is only accepted when the declared type is allowed
 * *and* the bytes look like the audio they claim to be.
 */

export const ALLOWED_MIME_TYPES = [
  'audio/webm',
  'audio/ogg',
  'audio/mp4',
  'audio/m4a',
  'audio/x-m4a',
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-wav',
  'audio/wave',
  'audio/flac',
  'audio/aac',
] as const;

export const ALLOWED_EXTENSIONS = [
  '.webm',
  '.ogg',
  '.oga',
  '.mp4',
  '.m4a',
  '.mp3',
  '.wav',
  '.flac',
  '.aac',
] as const;

/** Result of inspecting an uploaded file. */
export interface AudioValidationResult {
  valid: boolean;
  /** Machine-readable reason, safe to show to the user. */
  reason?: 'missing-file' | 'empty-file' | 'too-large' | 'unsupported-type' | 'not-audio';
  message?: string;
}

const EXTENSION_BY_MIME: Record<string, string> = {
  'audio/webm': '.webm',
  'audio/ogg': '.ogg',
  'audio/mp4': '.m4a',
  'audio/m4a': '.m4a',
  'audio/x-m4a': '.m4a',
  'audio/mpeg': '.mp3',
  'audio/mp3': '.mp3',
  'audio/wav': '.wav',
  'audio/x-wav': '.wav',
  'audio/wave': '.wav',
  'audio/flac': '.flac',
  'audio/aac': '.aac',
};

function baseMimeType(mimeType: string): string {
  return mimeType.split(';')[0].trim().toLowerCase();
}

function extensionOf(fileName: string): string {
  const dot = fileName.lastIndexOf('.');
  return dot === -1 ? '' : fileName.slice(dot).toLowerCase();
}

/**
 * Detects the container from the first bytes of the file.
 *
 * Returns the canonical MIME type, or `null` when the bytes match none of the
 * supported containers.
 */
export function sniffAudioContainer(buffer: Buffer): string | null {
  if (buffer.length < 12) return null;

  // Matroska / WebM (EBML header).
  if (buffer[0] === 0x1a && buffer[1] === 0x45 && buffer[2] === 0xdf && buffer[3] === 0xa3) {
    return 'audio/webm';
  }

  // Ogg.
  if (buffer.subarray(0, 4).toString('ascii') === 'OggS') {
    return 'audio/ogg';
  }

  // RIFF WAVE.
  if (
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WAVE'
  ) {
    return 'audio/wav';
  }

  // ISO base media (MP4 / M4A): the `ftyp` box.
  if (buffer.subarray(4, 8).toString('ascii') === 'ftyp') {
    return 'audio/mp4';
  }

  // FLAC.
  if (buffer.subarray(0, 4).toString('ascii') === 'fLaC') {
    return 'audio/flac';
  }

  // MP3: an ID3 tag, or a raw frame sync.
  if (buffer.subarray(0, 3).toString('ascii') === 'ID3') {
    return 'audio/mpeg';
  }
  if (buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0) {
    return 'audio/mpeg';
  }

  // ADTS AAC.
  if (buffer[0] === 0xff && (buffer[1] & 0xf6) === 0xf0) {
    return 'audio/aac';
  }

  return null;
}

/**
 * Checks an uploaded file against the allowed types, the size limit and the
 * container signature.
 */
export function validateAudioUpload(input: {
  buffer: Buffer | undefined;
  mimetype: string | undefined;
  originalname: string | undefined;
  size?: number;
  maxBytes: number;
}): AudioValidationResult {
  const { buffer, mimetype, originalname, maxBytes } = input;

  if (!buffer) {
    return {
      valid: false,
      reason: 'missing-file',
      message: 'No audio file was uploaded. Send the recording as the "file" field.',
    };
  }

  if (buffer.length === 0) {
    return {
      valid: false,
      reason: 'empty-file',
      message: 'The uploaded audio file is empty.',
    };
  }

  if (buffer.length > maxBytes) {
    const limitMb = Math.round(maxBytes / (1024 * 1024));
    return {
      valid: false,
      reason: 'too-large',
      message: `The audio file is larger than the ${limitMb} MB limit.`,
    };
  }

  const declaredType = baseMimeType(mimetype ?? '');
  const declaredExtension = extensionOf(originalname ?? '');
  const allowedType = (ALLOWED_MIME_TYPES as readonly string[]).includes(declaredType);
  const allowedExtension = (ALLOWED_EXTENSIONS as readonly string[]).includes(declaredExtension);

  if (!allowedType && !allowedExtension) {
    return {
      valid: false,
      reason: 'unsupported-type',
      message:
        'Unsupported audio format. Upload WebM, MP4/M4A, OGG, MP3, WAV, FLAC or AAC audio.',
    };
  }

  const sniffed = sniffAudioContainer(buffer);
  if (!sniffed) {
    return {
      valid: false,
      reason: 'not-audio',
      message: 'The uploaded file is not a recognised audio file.',
    };
  }

  // A declared type and a sniffed container have to describe the same format.
  // `audio/mp4` and `audio/m4a` are the same container, so they are compatible.
  const expected = EXTENSION_BY_MIME[declaredType];
  const sniffedExtension = EXTENSION_BY_MIME[sniffed];
  const declaredFamily = expected ? expected.replace(/^\./, '') : declaredType.replace('audio/', '');
  const sniffedFamily = sniffedExtension
    ? sniffedExtension.replace(/^\./, '')
    : sniffed.replace('audio/', '');

  if (declaredType && declaredFamily !== sniffedFamily) {
    return {
      valid: false,
      reason: 'not-audio',
      message: `The file contents look like ${sniffedFamily.toUpperCase()}, not ${declaredFamily.toUpperCase()}.`,
    };
  }

  return { valid: true };
}

/** Picks the file extension to send to the speech-to-text provider. */
export function extensionForMimeType(mimeType: string): string {
  return EXTENSION_BY_MIME[baseMimeType(mimeType)] ?? '.webm';
}
