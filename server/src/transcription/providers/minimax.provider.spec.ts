import { MiniMaxProvider, toMiniMaxLanguage } from './minimax.provider';
import { needsTranscode, withExtension } from '../audio-transcode';

const WEBM_BYTES = Buffer.concat([
  Buffer.from([0x1a, 0x45, 0xdf, 0xa3]),
  Buffer.alloc(64),
]);

interface CapturedRequest {
  url: string;
  headers: Record<string, string>;
  body: FormData;
}

describe('MiniMaxProvider', () => {
  const provider = new MiniMaxProvider({
    apiKey: 'test-key',
    baseUrl: 'https://api.minimax.io/v1',
    model: 'asr-1.0',
    timeoutMs: 5_000,
    ffmpegPath: 'ffmpeg',
  });

  let captured: CapturedRequest | undefined;
  let responseBody: unknown;
  let responseStatus = 200;

  beforeEach(() => {
    captured = undefined;
    responseBody = { text: 'Hello there.', duration: 2.5 };
    responseStatus = 200;

    global.fetch = jest.fn(async (url: string, init: RequestInit) => {
      captured = {
        url: String(url),
        headers: init.headers as Record<string, string>,
        body: init.body as FormData,
      };
      return {
        ok: responseStatus >= 200 && responseStatus < 300,
        status: responseStatus,
        json: async () => responseBody,
        text: async () => JSON.stringify(responseBody),
      } as unknown as Response;
    }) as unknown as typeof fetch;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('posts to the MiniMax speech-to-text endpoint', async () => {
    const result = await provider.transcribe({
      audio: Buffer.from('ID3 fake mp3'),
      fileName: 'speaking-1.mp3',
      mimeType: 'audio/mpeg',
    });

    expect(captured?.url).toBe('https://api.minimax.io/v1/speech_to_text');
    expect(captured?.headers.Authorization).toBe('Bearer test-key');
    expect(result.text).toBe('Hello there.');
    expect(result.durationSeconds).toBe(2.5);
    expect(result.provider).toBe('minimax');
  });

  it('sends the model as a form field', async () => {
    await provider.transcribe({
      audio: Buffer.from('ID3 fake mp3'),
      fileName: 'speaking-1.mp3',
      mimeType: 'audio/mpeg',
    });

    expect(captured?.body.get('model')).toBe('asr-1.0');
    const file = captured?.body.get('file') as File;
    expect(file.name).toBe('speaking-1.mp3');
  });

  it('sends the language as a header, not a form field', async () => {
    await provider.transcribe({
      audio: Buffer.from('ID3 fake mp3'),
      fileName: 'speaking-1.mp3',
      mimeType: 'audio/mpeg',
      language: 'en',
    });

    expect(captured?.headers.language).toBe('en');
    expect(captured?.body.get('language')).toBeNull();
  });

  it('converts a WebM recording before sending it', async () => {
    // The conversion runs through ffmpeg; pointing it at a binary that does
    // not exist proves the WebM upload takes the conversion path instead of
    // being sent as it is.
    const providerWithoutFfmpeg = new MiniMaxProvider({
      apiKey: 'test-key',
      baseUrl: 'https://api.minimax.io/v1',
      model: 'asr-1.0',
      timeoutMs: 5_000,
      ffmpegPath: '/nonexistent/ffmpeg',
    });

    await expect(
      providerWithoutFfmpeg.transcribe({
        audio: WEBM_BYTES,
        fileName: 'speaking-1.webm',
        mimeType: 'audio/webm',
      }),
    ).rejects.toThrow(/ffmpeg was not found/i);

    expect(captured).toBeUndefined();
  });

  it('reports a provider failure', async () => {
    responseStatus = 402;

    await expect(
      provider.transcribe({
        audio: Buffer.from('ID3 fake mp3'),
        fileName: 'speaking-1.mp3',
        mimeType: 'audio/mpeg',
      }),
    ).rejects.toThrow(/status 402/i);
  });

  it('passes the provider error message on', async () => {
    responseStatus = 402;
    responseBody = {
      type: 'error',
      error: { message: 'insufficient balance (1008)', http_code: '402' },
    };

    await expect(
      provider.transcribe({
        audio: Buffer.from('ID3 fake mp3'),
        fileName: 'speaking-1.mp3',
        mimeType: 'audio/mpeg',
      }),
    ).rejects.toThrow(/insufficient balance/);
  });

  it('rejects a response without text', async () => {
    responseBody = { duration: 3 };

    await expect(
      provider.transcribe({
        audio: Buffer.from('ID3 fake mp3'),
        fileName: 'speaking-1.mp3',
        mimeType: 'audio/mpeg',
      }),
    ).rejects.toThrow(/unexpected response/i);
  });
});

describe('toMiniMaxLanguage', () => {
  it('keeps a supported language', () => {
    expect(toMiniMaxLanguage('en')).toBe('en');
    expect(toMiniMaxLanguage('th')).toBe('th');
  });

  it('reduces a regional tag to its primary subtag', () => {
    expect(toMiniMaxLanguage('en-gb')).toBe('en');
  });

  it('drops a language the endpoint does not support', () => {
    expect(toMiniMaxLanguage('nl')).toBeUndefined();
  });

  it('drops a missing language', () => {
    expect(toMiniMaxLanguage(undefined)).toBeUndefined();
  });
});

describe('needsTranscode', () => {
  it('flags the containers browsers record', () => {
    expect(needsTranscode('audio/webm')).toBe(true);
    expect(needsTranscode('audio/mp4')).toBe(true);
    expect(needsTranscode('audio/webm;codecs=opus')).toBe(true);
  });

  it('leaves the containers MiniMax accepts alone', () => {
    expect(needsTranscode('audio/mpeg')).toBe(false);
    expect(needsTranscode('audio/wav')).toBe(false);
    expect(needsTranscode('audio/flac')).toBe(false);
    expect(needsTranscode('audio/ogg')).toBe(false);
  });
});

describe('withExtension', () => {
  it('replaces the extension', () => {
    expect(withExtension('speaking-1.webm', '.mp3')).toBe('speaking-1.mp3');
  });

  it('adds an extension when there is none', () => {
    expect(withExtension('recording', '.mp3')).toBe('recording.mp3');
  });
});
