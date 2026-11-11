import {
  extensionForMimeType,
  sniffAudioContainer,
  validateAudioUpload,
} from './audio-validation';

/** Minimal valid container headers used to build test fixtures. */
const WEBM_HEADER = Buffer.from([0x1a, 0x45, 0xdf, 0xa3, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
const OGG_HEADER = Buffer.concat([
  Buffer.from('OggS', 'ascii'),
  Buffer.alloc(8),
]);
const WAV_HEADER = Buffer.concat([
  Buffer.from('RIFF', 'ascii'),
  Buffer.alloc(4),
  Buffer.from('WAVE', 'ascii'),
]);
const MP4_HEADER = Buffer.concat([
  Buffer.alloc(4),
  Buffer.from('ftyp', 'ascii'),
  Buffer.alloc(4),
]);
const MP3_HEADER = Buffer.concat([Buffer.from('ID3', 'ascii'), Buffer.alloc(9)]);
const FLAC_HEADER = Buffer.concat([Buffer.from('fLaC', 'ascii'), Buffer.alloc(8)]);
const TEXT_HEADER = Buffer.from('this is definitely not audio at all', 'ascii');

const MAX_BYTES = 1024 * 1024;

describe('sniffAudioContainer', () => {
  it('detects webm', () => {
    expect(sniffAudioContainer(WEBM_HEADER)).toBe('audio/webm');
  });

  it('detects ogg', () => {
    expect(sniffAudioContainer(OGG_HEADER)).toBe('audio/ogg');
  });

  it('detects wav', () => {
    expect(sniffAudioContainer(WAV_HEADER)).toBe('audio/wav');
  });

  it('detects mp4 and m4a', () => {
    expect(sniffAudioContainer(MP4_HEADER)).toBe('audio/mp4');
  });

  it('detects mp3', () => {
    expect(sniffAudioContainer(MP3_HEADER)).toBe('audio/mpeg');
  });

  it('detects flac', () => {
    expect(sniffAudioContainer(FLAC_HEADER)).toBe('audio/flac');
  });

  it('returns null for a text file', () => {
    expect(sniffAudioContainer(TEXT_HEADER)).toBeNull();
  });

  it('returns null for a file that is too short to classify', () => {
    expect(sniffAudioContainer(Buffer.from([0x01, 0x02]))).toBeNull();
  });
});

describe('validateAudioUpload', () => {
  it('accepts a webm recording', () => {
    const result = validateAudioUpload({
      buffer: WEBM_HEADER,
      mimetype: 'audio/webm',
      originalname: 'speaking-1.webm',
      maxBytes: MAX_BYTES,
    });

    expect(result).toEqual({ valid: true });
  });

  it('accepts an m4a recording from Safari', () => {
    const result = validateAudioUpload({
      buffer: MP4_HEADER,
      mimetype: 'audio/mp4',
      originalname: 'speaking-1.m4a',
      maxBytes: MAX_BYTES,
    });

    expect(result).toEqual({ valid: true });
  });

  it('rejects a missing file', () => {
    const result = validateAudioUpload({
      buffer: undefined,
      mimetype: 'audio/webm',
      originalname: 'speaking-1.webm',
      maxBytes: MAX_BYTES,
    });

    expect(result.valid).toBe(false);
    expect(result.reason).toBe('missing-file');
  });

  it('rejects an empty file', () => {
    const result = validateAudioUpload({
      buffer: Buffer.alloc(0),
      mimetype: 'audio/webm',
      originalname: 'speaking-1.webm',
      maxBytes: MAX_BYTES,
    });

    expect(result.valid).toBe(false);
    expect(result.reason).toBe('empty-file');
  });

  it('rejects a file over the size limit', () => {
    const result = validateAudioUpload({
      buffer: Buffer.alloc(2048),
      mimetype: 'audio/webm',
      originalname: 'speaking-1.webm',
      maxBytes: 1024,
    });

    expect(result.valid).toBe(false);
    expect(result.reason).toBe('too-large');
  });

  it('rejects an unsupported type', () => {
    const result = validateAudioUpload({
      buffer: TEXT_HEADER,
      mimetype: 'application/pdf',
      originalname: 'notes.pdf',
      maxBytes: MAX_BYTES,
    });

    expect(result.valid).toBe(false);
    expect(result.reason).toBe('unsupported-type');
  });

  it('rejects a file whose contents are not audio', () => {
    const result = validateAudioUpload({
      buffer: TEXT_HEADER,
      mimetype: 'audio/webm',
      originalname: 'speaking-1.webm',
      maxBytes: MAX_BYTES,
    });

    expect(result.valid).toBe(false);
    expect(result.reason).toBe('not-audio');
  });

  it('rejects a file whose contents contradict the declared type', () => {
    const result = validateAudioUpload({
      buffer: MP3_HEADER,
      mimetype: 'audio/webm',
      originalname: 'speaking-1.webm',
      maxBytes: MAX_BYTES,
    });

    expect(result.valid).toBe(false);
    expect(result.reason).toBe('not-audio');
  });
});

describe('extensionForMimeType', () => {
  it('maps webm', () => {
    expect(extensionForMimeType('audio/webm')).toBe('.webm');
  });

  it('maps mp4 to m4a', () => {
    expect(extensionForMimeType('audio/mp4')).toBe('.m4a');
  });

  it('maps ogg', () => {
    expect(extensionForMimeType('audio/ogg')).toBe('.ogg');
  });

  it('falls back to webm', () => {
    expect(extensionForMimeType('audio/unknown')).toBe('.webm');
  });
});
