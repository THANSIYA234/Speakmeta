import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { TranscriptionController } from './transcription.controller';
import { TranscriptionService } from './transcription.service';
import { MockProvider } from './providers/mock.provider';

const WEBM_BYTES = Buffer.concat([
  Buffer.from([0x1a, 0x45, 0xdf, 0xa3]),
  Buffer.alloc(64),
]);

const TEXT_BYTES = Buffer.from('this is a plain text file, not audio', 'ascii');

describe('TranscriptionController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [TranscriptionController],
      providers: [
        {
          provide: TranscriptionService,
          useFactory: () => new TranscriptionService(new MockProvider(), 1024 * 1024),
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('accepts an audio upload and returns the transcription', async () => {
    const response = await request(app.getHttpServer())
      .post('/transcription')
      .attach('file', WEBM_BYTES, { filename: 'speaking-1.webm', contentType: 'audio/webm' });

    expect(response.status).toBe(200);
    expect(response.body.text).toContain('speaking-1.webm');
    expect(response.body.provider).toBe('mock');
  });

  it('rejects a request without a file', async () => {
    const response = await request(app.getHttpServer()).post('/transcription');

    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/No audio file/i);
  });

  it('rejects a file that is not audio', async () => {
    const response = await request(app.getHttpServer())
      .post('/transcription')
      .attach('file', TEXT_BYTES, { filename: 'notes.txt', contentType: 'text/plain' });

    expect(response.status).toBe(400);
  });

  it('rejects an unsupported file type', async () => {
    const response = await request(app.getHttpServer())
      .post('/transcription')
      .attach('file', TEXT_BYTES, { filename: 'notes.pdf', contentType: 'application/pdf' });

    expect(response.status).toBe(400);
  });

  it('reports the active provider', async () => {
    const response = await request(app.getHttpServer()).get('/transcription/provider');

    expect(response.status).toBe(200);
    expect(response.body.provider).toBe('mock');
  });
});
