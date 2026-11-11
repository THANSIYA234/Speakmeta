import { loadConfig } from './configuration';

describe('loadConfig', () => {
  it('reads the MiniMax settings', () => {
    const config = loadConfig({
      STT_PROVIDER: 'minimax',
      MINIMAX_API_KEY: 'minimax-key',
    });

    expect(config.stt.provider).toBe('minimax');
    expect(config.stt.minimax.apiKey).toBe('minimax-key');
    expect(config.stt.minimax.baseUrl).toBe('https://api.minimax.io/v1');
    expect(config.stt.minimax.model).toBe('asr-1.0');
    expect(config.stt.minimax.ffmpegPath).toBe('ffmpeg');
  });

  it('trims the base URL and applies the overrides', () => {
    const config = loadConfig({
      STT_PROVIDER: 'minimax',
      MINIMAX_API_KEY: 'minimax-key',
      MINIMAX_BASE_URL: 'https://api.minimax.io/v1/',
      MINIMAX_TRANSCRIBE_MODEL: 'asr-2.0',
      MINIMAX_FFMPEG_PATH: '/usr/local/bin/ffmpeg',
    });

    expect(config.stt.minimax.baseUrl).toBe('https://api.minimax.io/v1');
    expect(config.stt.minimax.model).toBe('asr-2.0');
    expect(config.stt.minimax.ffmpegPath).toBe('/usr/local/bin/ffmpeg');
  });

  it('refuses to boot without a MiniMax key', () => {
    expect(() => loadConfig({ STT_PROVIDER: 'minimax' })).toThrow(/MINIMAX_API_KEY/);
  });

  it('rejects an unknown provider', () => {
    expect(() => loadConfig({ STT_PROVIDER: 'whisper' })).toThrow(/STT_PROVIDER/);
  });

  it('does not require a provider key for the mock provider', () => {
    const config = loadConfig({ STT_PROVIDER: 'mock' });

    expect(config.stt.provider).toBe('mock');
    expect(config.stt.openai.apiKey).toBeNull();
    expect(config.stt.minimax.apiKey).toBeNull();
  });
});
