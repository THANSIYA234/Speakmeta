import { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { Link, useNavigate, useParams } from 'react-router-dom';

import AppHeader from '../components/AppHeader';
import TranscriptionCard from '../components/TranscriptionCard';
import VoiceRecorder from '../components/VoiceRecorder';
import { getTopicById, topics } from '../data/mockData';
import { useTranscription } from '../hooks/useTranscription';
import { formatBytes, formatDuration } from '../utils/format';
import { toUploadPayload } from '../utils/upload';
import type { AudioUploadPayload } from '../utils/upload';
import type { Topic, VoiceRecording } from '../types';
import { palette } from '../theme/theme';

function PracticeSession({ topic }: { topic: Topic }) {
  const navigate = useNavigate();
  const [recording, setRecording] = useState<VoiceRecording | null>(null);
  /**
   * The recording prepared for the backend.
   *
   * The audio never leaves the device in this phase, but the payload is built
   * here so the upload path is ready and exercised rather than assumed.
   */
  const [upload, setUpload] = useState<AudioUploadPayload | null>(null);
  const {
    status: transcriptionStatus,
    text: transcriptionText,
    error: transcriptionError,
    transcribe,
    reset: resetTranscription,
  } = useTranscription();
  /**
   * Whether the user already handed the transcript over for correction.
   *
   * Grammar correction is a later phase, so the action only acknowledges the
   * submission instead of calling an endpoint that does not exist yet.
   */
  const [submittedForCorrection, setSubmittedForCorrection] = useState(false);

  const handleRecordingComplete = (next: VoiceRecording) => {
    setRecording(next);
    setUpload(toUploadPayload(next));
    resetTranscription();
    setSubmittedForCorrection(false);
  };

  const handleReset = () => {
    setRecording(null);
    setUpload(null);
    resetTranscription();
    setSubmittedForCorrection(false);
  };

  const handleTranscribe = () => {
    if (!upload) return;
    setSubmittedForCorrection(false);
    void transcribe(upload.file);
  };

  return (
    <Box sx={{ pb: 12 }}>
      <AppHeader title="Speaking practice" subtitle={topic.title} showBack />

      <Box sx={{ px: { xs: 2, sm: 3 }, pt: 2, maxWidth: 760, mx: 'auto' }}>
        {/* Selected topic */}
        <Card
          sx={{
            backgroundImage: `linear-gradient(135deg, ${topic.accent} 0%, ${topic.accent}CC 100%)`,
            color: '#fff',
            border: 'none',
          }}
        >
          <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
              <Box
                sx={{
                  width: 52,
                  height: 52,
                  borderRadius: '16px',
                  display: 'grid',
                  placeItems: 'center',
                  bgcolor: 'rgba(255,255,255,0.22)',
                  fontSize: 24,
                  flexShrink: 0,
                }}
              >
                <span aria-hidden>{topic.icon}</span>
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 800,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    opacity: 0.9,
                  }}
                >
                  Topic
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                  {topic.title}
                </Typography>
              </Box>
            </Stack>

            <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: 'wrap', gap: 1 }}>
              <Chip
                size="small"
                label={topic.difficulty}
                sx={{ bgcolor: 'rgba(255,255,255,0.22)', color: '#fff' }}
              />
              <Chip
                size="small"
                icon={<AccessTimeRoundedIcon sx={{ color: '#fff !important' }} />}
                label={`~${topic.durationMinutes} min`}
                sx={{ bgcolor: 'rgba(255,255,255,0.22)', color: '#fff' }}
              />
            </Stack>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card sx={{ mt: 2 }}>
          <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
              Your task
            </Typography>
            <Typography variant="body1" sx={{ mt: 0.75, color: palette.text }}>
              {topic.prompt}
            </Typography>

            <Box sx={{ mt: 2, bgcolor: palette.secondarySoft, borderRadius: '16px', p: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 800, mb: 1 }}>
                Instructions
              </Typography>
              <Stack spacing={0.75}>
                {topic.instructions.map((instruction) => (
                  <Box key={instruction} sx={{ display: 'flex', gap: 1 }}>
                    <Typography variant="body2" sx={{ color: palette.primary, fontWeight: 800 }}>
                      •
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {instruction}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </Box>
          </CardContent>
        </Card>

        {/* Recording area */}
        <VoiceRecorder
          onRecordingComplete={handleRecordingComplete}
          onReset={handleReset}
        />

        {recording && (
          <Alert severity="success" sx={{ mt: 2 }}>
            Recording captured ({formatDuration(recording.durationMs)}). Transcribe it to check
            your words before the correction phase arrives.
          </Alert>
        )}

        {upload && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            Stored on this device as {upload.fileName} ({formatBytes(upload.sizeBytes)}). It is
            uploaded when you ask for a transcription.
          </Typography>
        )}

        {upload && (
          <Button
            fullWidth
            variant="contained"
            sx={{ mt: 2 }}
            disabled={transcriptionStatus === 'uploading'}
            onClick={handleTranscribe}
          >
            Transcribe
          </Button>
        )}

        {upload && (
          <TranscriptionCard
            status={transcriptionStatus}
            text={transcriptionText}
            error={transcriptionError}
            onRetry={handleTranscribe}
            onSubmit={() => setSubmittedForCorrection(true)}
          />
        )}

        {submittedForCorrection && (
          <Alert severity="info" sx={{ mt: 2 }}>
            Your transcript was accepted. The corrected version arrives in a later phase.
          </Alert>
        )}

        <Button fullWidth variant="outlined" sx={{ mt: 2 }} onClick={() => navigate('/topics')}>
          Try another topic
        </Button>

        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: 'block', textAlign: 'center', mt: 2 }}
        >
          {topics.length} topics available
        </Typography>
      </Box>
    </Box>
  );
}

export default function SpeakingPractice() {
  const { topicId } = useParams<{ topicId: string }>();
  const topic = useMemo(() => getTopicById(topicId), [topicId]);

  if (!topic) {
    return (
      <Box sx={{ pb: 12 }}>
        <AppHeader title="Speaking practice" showBack />
        <Box sx={{ px: 2, pt: 3, maxWidth: 640, mx: 'auto' }}>
          <Alert severity="info" icon={<InfoOutlinedIcon />}>
            No topic selected. Choose one from the topic list to start practising.
          </Alert>
          <Button fullWidth variant="contained" sx={{ mt: 2 }} component={Link} to="/topics">
            Browse topics
          </Button>
        </Box>
      </Box>
    );
  }

  return <PracticeSession key={topic.id} topic={topic} />;
}
