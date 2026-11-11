import { useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';

import { formatDuration } from '../utils/format';

interface AudioPlayerProps {
  src: string;
  label?: string;
  /**
   * Duration the recorder measured, in milliseconds.
   *
   * Audio produced by `MediaRecorder` often carries no duration in its
   * header, so the browser reports `Infinity` and the scrub bar stays empty.
   * The recorder already knows the real length, so it is passed in and used
   * whenever the browser cannot work it out.
   */
  fallbackDurationMs?: number;
}

/**
 * Native audio player for a recorded blob.
 *
 * Files produced by `MediaRecorder` carry no duration in their header, so the
 * browser reports `Infinity` and the scrub bar stays empty. Seeking past the
 * end once makes the browser compute the real duration, after which the
 * timeline works normally. That trick only works on formats the browser can
 * seek in, so the duration measured by the recorder is used as the fallback.
 */
export default function AudioPlayer({
  src,
  label = 'Recorded audio playback',
  fallbackDurationMs,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [durationMs, setDurationMs] = useState<number | null>(fallbackDurationMs ?? null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    setDurationMs(fallbackDurationMs ?? null);

    const revealDuration = () => {
      if (!Number.isFinite(audio.duration)) {
        // Seeking far past the end makes the browser scan the file and work
        // out its length. Browsers that cannot seek here simply ignore it.
        try {
          audio.currentTime = 1e6;
        } catch {
          // Seeking failed; the fallback duration stays on screen.
        }
      }
    };

    // Once the browser knows the real length it lands on the last frame,
    // because that is where the seek above pointed. Move back to the start.
    const restoreStart = () => {
      if (Number.isFinite(audio.duration)) {
        setDurationMs(Math.round(audio.duration * 1000));
        if (audio.currentTime >= audio.duration) {
          audio.currentTime = 0;
        }
      }
    };

    audio.addEventListener('loadedmetadata', revealDuration);
    audio.addEventListener('durationchange', restoreStart);
    revealDuration();

    return () => {
      audio.removeEventListener('loadedmetadata', revealDuration);
      audio.removeEventListener('durationchange', restoreStart);
    };
  }, [fallbackDurationMs, src]);

  return (
    <Box>
      <Box
        component="audio"
        ref={audioRef}
        controls
        src={src}
        preload="metadata"
        aria-label={label}
        sx={{ width: '100%' }}
      />
      {durationMs !== null && (
        <Box
          component="span"
          sx={{
            display: 'block',
            mt: 0.75,
            fontSize: '0.8125rem',
            color: 'text.secondary',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {formatDuration(durationMs)}
        </Box>
      )}
    </Box>
  );
}
