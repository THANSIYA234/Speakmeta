import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';

import AppHeader from '../components/AppHeader';
import TopicCard from '../components/TopicCard';
import { topics } from '../data/mockData';
import { palette } from '../theme/theme';

export default function TopicSelection() {
  return (
    <Box sx={{ pb: 12 }}>
      <AppHeader title="Choose a topic" subtitle="What do you want to talk about?" />

      <Box sx={{ px: { xs: 2, sm: 3 }, pt: 2, maxWidth: 1100, mx: 'auto' }}>
        <Box
          sx={{
            bgcolor: palette.secondarySoft,
            borderRadius: '20px',
            border: `1px solid ${palette.primaryLight}`,
            p: 2.25,
            mb: 2.5,
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
            Pick a scenario and start speaking
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Each topic includes a prompt, speaking tips and a recommended length.
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mt: 1.5, flexWrap: 'wrap', gap: 1 }}>
            <Chip
              size="small"
              label={`${topics.length} topics`}
              sx={{ bgcolor: '#fff', color: palette.primaryDark }}
            />
            <Chip
              size="small"
              label="5–10 min each"
              sx={{ bgcolor: '#fff', color: palette.primaryDark }}
            />
          </Stack>
        </Box>

        <Grid container spacing={2}>
          {topics.map((topic) => (
            <Grid key={topic.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <TopicCard topic={topic} />
            </Grid>
          ))}
        </Grid>
      </Box>
    </Box>
  );
}
