import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

import { transcodeToMp3 } from './audio-transcode';

const run = promisify(execFile);

const WEBM_HEADER = Buffer.from([0x1a, 0x45, 0xdf, 0xa3]);

/**
 * The conversion is only meaningful with a real ffmpeg: the tests below build
 * an actual WebM file, convert it and check the result is playable MP3. When
 * ffmpeg is missing the suite skips instead of failing, so the repository
 * stays testable on a machine without it.
 */
let ffmpegAvailable = false;

beforeAll(async () => {
  try {
    await run('ffmpeg', ['-version']);
    ffmpegAvailable = true;
  } catch {
    ffmpegAvailable = false;
  }
});

async function makeWebm(): Promise<Buffer> {
  const { stdout } = await run(
    'ffmpeg',
    [
      '-hide_banner',
      '-loglevel',
      'error',
      '-f',
      'lavfi',
      '-i',
      'sine=frequency=440:duration=1',
      '-c:a',
      'libopus',
      '-b:a',
      '32k',
      '-f',
      'webm',
      'pipe:1',
    ],
    { encoding: 'buffer', maxBuffer: 16 * 1024 * 1024 },
  );

  return stdout;
}

describe('transcodeToMp3', () => {
  it('converts a WebM recording into MP3', async () => {
    if (!ffmpegAvailable) {
      return;
    }

    const webm = await makeWebm();
    const mp3 = await transcodeToMp3(webm, { ffmpegPath: 'ffmpeg', timeoutMs: 30_000 });

    // An MP3 file starts with an ID3 tag or a frame sync.
    const isId3 = mp3.subarray(0, 3).toString('ascii') === 'ID3';
    const isFrameSync = mp3[0] === 0xff && (mp3[1] & 0xe0) === 0xe0;
    expect(isId3 || isFrameSync).toBe(true);
    expect(mp3.length).toBeGreaterThan(0);
  });

  it('reports a missing ffmpeg binary', async () => {
    await expect(
      transcodeToMp3(WEBM_HEADER, {
        ffmpegPath: '/nonexistent/ffmpeg',
        timeoutMs: 5_000,
      }),
    ).rejects.toThrow(/ffmpeg was not found/i);
  });
});
