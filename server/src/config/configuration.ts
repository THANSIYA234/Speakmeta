/**
 * Runtime configuration for the API.
 *
 * Every secret is read from the environment and never from a checked-in file.
 * `validate` runs once at boot, so a missing key fails the process immediately
 * instead of failing on the first upload.
 */
export type SttProviderName = 'openai' | 'minimax' | 'mock';

export interface AppConfig {
  port: number;
  corsOrigins: string[];
  stt: {
    provider: SttProviderName;
    openai: {
      apiKey: string | null;
      baseUrl: string;
      model: string;
      timeoutMs: number;
    };
    minimax: {
      apiKey: string | null;
      baseUrl: string;
      model: string;
      timeoutMs: number;
      ffmpegPath: string;
    };
    maxUploadBytes: number;
  };
}

const DEFAULTS = {
  port: 3000,
  openaiBaseUrl: 'https://api.openai.com/v1',
  openaiModel: 'whisper-1',
  openaiTimeoutMs: 120_000,
  minimaxBaseUrl: 'https://api.minimax.io/v1',
  minimaxModel: 'asr-1.0',
  minimaxTimeoutMs: 120_000,
  minimaxFfmpegPath: 'ffmpeg',
  maxUploadBytes: 25 * 1024 * 1024,
  /**
   * The Vite dev server answers on both hostnames, and the browser sends the
   * one the developer actually typed. Both are allowed so the request is not
   * blocked by CORS depending on how the page was opened.
   */
  corsOrigins: 'http://localhost:5173,http://127.0.0.1:5173',
} as const;

function readPort(value: string | undefined): number {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULTS.port;
}

function readPositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function readOrigins(value: string | undefined): string[] {
  const raw = value ?? DEFAULTS.corsOrigins;
  return raw
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const provider = (env.STT_PROVIDER ?? 'openai').trim().toLowerCase();

  if (provider !== 'openai' && provider !== 'minimax' && provider !== 'mock') {
    throw new Error(
      `STT_PROVIDER must be "openai", "minimax" or "mock", received "${provider}".`,
    );
  }

  const apiKey = env.OPENAI_API_KEY?.trim() || null;

  if (provider === 'openai' && !apiKey) {
    throw new Error(
      'OPENAI_API_KEY is required when STT_PROVIDER is "openai". ' +
        'Set it in the environment or use STT_PROVIDER=mock for local development.',
    );
  }

  const minimaxApiKey = env.MINIMAX_API_KEY?.trim() || null;

  if (provider === 'minimax' && !minimaxApiKey) {
    throw new Error(
      'MINIMAX_API_KEY is required when STT_PROVIDER is "minimax". ' +
        'Set it in the environment or use STT_PROVIDER=mock for local development.',
    );
  }

  return {
    port: readPort(env.PORT),
    corsOrigins: readOrigins(env.CORS_ORIGINS),
    stt: {
      provider,
      openai: {
        apiKey,
        baseUrl: (env.OPENAI_BASE_URL ?? DEFAULTS.openaiBaseUrl).replace(/\/+$/, ''),
        model: env.OPENAI_TRANSCRIBE_MODEL ?? DEFAULTS.openaiModel,
        timeoutMs: readPositiveInt(env.OPENAI_TIMEOUT_MS, DEFAULTS.openaiTimeoutMs),
      },
      minimax: {
        apiKey: minimaxApiKey,
        baseUrl: (env.MINIMAX_BASE_URL ?? DEFAULTS.minimaxBaseUrl).replace(/\/+$/, ''),
        model: env.MINIMAX_TRANSCRIBE_MODEL ?? DEFAULTS.minimaxModel,
        timeoutMs: readPositiveInt(env.MINIMAX_TIMEOUT_MS, DEFAULTS.minimaxTimeoutMs),
        ffmpegPath: env.MINIMAX_FFMPEG_PATH?.trim() || DEFAULTS.minimaxFfmpegPath,
      },
      maxUploadBytes: readPositiveInt(env.MAX_UPLOAD_BYTES, DEFAULTS.maxUploadBytes),
    },
  };
}
