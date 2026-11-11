import { BadRequestException, PayloadTooLargeException } from '@nestjs/common';

import { MockProvider } from './providers/mock.provider';
import { TranscriptionService } from './transcription.service';

const WEBM_HEADER = Buffer.from([0x1a, 0x45, 0xdf, 0xa3, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
const TEXT_HEADER = Buffer.from('not audio at all', 'ascii');

describe('TranscriptionService', () => {
  const service = new TranscriptionService(new MockProvider(), 1024 * 1024);

  it('returns the transcribed text', async () => {
    const result = await service.transcribe({
      buffer: WEBM_HEADER,
      mimetype: 'audio/webm',
      originalname: 'speaking-1.webm',
    });

    expect(result.text).toContain('speaking-1.webm');
    expect(result.provider).toBe('mock');
    expect(result.language).toBeNull();
  });

  it('rejects a file that is not audio', async () => {
    await expect(
      service.transcribe({
        buffer: TEXT_HEADER,
        mimetype: 'audio/webm',
        originalname: 'speaking-1.webm',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects a file over the size limit with 413', async () => {
    // The fixture is 12 bytes, so a 8 byte limit is exceeded.
    const small = new TranscriptionService(new MockProvider(), 8);

    await expect(
      small.transcribe({
        buffer: WEBM_HEADER,
        mimetype: 'audio/webm',
        originalname: 'speaking-1.webm',
      }),
    ).rejects.toBeInstanceOf(PayloadTooLargeException);
  });

  it('reports the provider name', () => {
    expect(service.providerName).toBe('mock');
  });

  it('passes a valid language hint through', async () => {
    const result = await service.transcribe({
      buffer: WEBM_HEADER,
      mimetype: 'audio/webm',
      originalname: 'speaking-1.webm',
      language: 'en-GB',
    });

    expect(result.language).toBe('en-gb');
  });

  it('ignores a malformed language hint', async () => {
    const result = await service.transcribe({
      buffer: WEBM_HEADER,
      mimetype: 'audio/webm',
      originalname: 'speaking-1.webm',
      language: 'english!',
    });

    expect(result.language).toBeNull();
  });
});
