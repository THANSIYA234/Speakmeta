import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import LinearProgress from '@mui/material/LinearProgress';
import LocalFireDepartmentRoundedIcon from '@mui/icons-material/LocalFireDepartmentRounded';
import MicRoundedIcon from '@mui/icons-material/MicRounded';
import TimerRoundedIcon from '@mui/icons-material/TimerRounded';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import { useNavigate } from 'react-router-dom';

import AppHeader from '../components/AppHeader';
import ProgressCard from '../components/ProgressCard';
import StatCard from '../components/StatCard';
import { dailyChallenge, dailyProgress, userProfile, weekActivity } from '../data/mockData';
import { palette } from '../theme/theme';

export default function Dashboard() {
  const navigate = useNavigate();

  const maxMinutes = Math.max(...weekActivity.map((day) => day.minutes), 1);

  return (
    <Box sx={{ pb: 12 }}>
      <AppHeader showAvatar />

      <Box sx={{ px: { xs: 2, sm: 3 }, pt: 2, maxWidth: 1100, mx: 'auto' }}>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>
          Ready to improve your English today?
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Welcome back, {userProfile.firstName}. You are{' '}
          {dailyProgress.xpTarget - dailyProgress.xpEarned} XP away from today's goal.
        </Typography>

        {/* Daily speaking challenge */}
        <Card
          sx={{
            mt: 2.5,
            backgroundImage: `linear-gradient(135deg, ${palette.primary} 0%, ${palette.primaryDark} 100%)`,
            color: '#fff',
            border: 'none',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <Box
            aria-hidden
            sx={{
              position: 'absolute',
              width: 220,
              height: 220,
              borderRadius: '50%',
              bgcolor: 'rgba(255,255,255,0.12)',
              top: -90,
              right: -60,
            }}
          />
          <CardContent sx={{ p: 3, position: 'relative', '&:last-child': { pb: 3 } }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <AutoAwesomeRoundedIcon sx={{ fontSize: 18 }} />
              <Typography variant="caption" sx={{ fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Daily speaking challenge
              </Typography>
            </Stack>

            <Typography variant="h5" sx={{ mt: 1.5, fontWeight: 800 }}>
              {dailyChallenge.title}
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.75, opacity: 0.9, maxWidth: 520 }}>
              {dailyChallenge.prompt}
            </Typography>

            <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: 'wrap', gap: 1 }}>
              <Chip
                size="small"
                label={`${dailyChallenge.targetWords} words`}
                sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff' }}
              />
              <Chip
                size="small"
                label={`+${dailyChallenge.xp} XP`}
                sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff' }}
              />
            </Stack>

            <Button
              variant="contained"
              size="large"
              startIcon={<MicRoundedIcon />}
              onClick={() => navigate(`/practice/${dailyChallenge.topicId}`)}
              sx={{
                mt: 2.5,
                backgroundColor: '#fff',
                backgroundImage: 'none',
                color: palette.primaryDark,
                '&:hover': {
                  backgroundColor: palette.primaryLight,
                  backgroundImage: 'none',
                },
              }}
            >
              Start Speaking
            </Button>
          </CardContent>
        </Card>

        {/* Daily progress + streak */}
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <ProgressCard
              title="Today's learning goal"
              caption="Sessions completed"
              value={dailyProgress.sessionsCompleted}
              max={dailyProgress.sessionsTarget}
              unit={`/${dailyProgress.sessionsTarget}`}
              icon={<TimerRoundedIcon />}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <StatCard
              label="Speaking streak"
              value={`${userProfile.currentStreak} days`}
              hint={`Longest streak: ${userProfile.longestStreak} days`}
              icon={<LocalFireDepartmentRoundedIcon />}
              accent={palette.warning}
              accentSoft="#FFF3DF"
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <StatCard
              label="Minutes practised"
              value={`${dailyProgress.minutesPracticed} min`}
              hint={`Goal: ${dailyProgress.minutesTarget} min`}
              icon={<MicRoundedIcon />}
              accent={palette.success}
              accentSoft="#E4F7EC"
            />
          </Grid>
        </Grid>

        {/* Week activity + XP */}
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid size={{ xs: 12, md: 7 }}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                  This week
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                  {dailyProgress.minutesPracticed} minutes practised in the last 7 days
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1.5, mt: 2.5, height: 120 }}>
                  {weekActivity.map((day, index) => (
                    <Box key={`${day.day}-${index}`} sx={{ flexGrow: 1, textAlign: 'center' }}>
                      <Box
                        sx={{
                          height: 96,
                          display: 'flex',
                          alignItems: 'flex-end',
                        }}
                      >
                        <Box
                          sx={{
                            width: '100%',
                            height: `${Math.max((day.minutes / maxMinutes) * 100, 4)}%`,
                            borderRadius: '10px 10px 6px 6px',
                            backgroundImage:
                              day.minutes > 0
                                ? `linear-gradient(180deg, ${palette.primary} 0%, ${palette.secondary} 100%)`
                                : `${palette.primaryLight}`,
                          }}
                        />
                      </Box>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', mt: 0.75, display: 'block' }}>
                        {day.day}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 5 }}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                  Daily XP
                </Typography>
                <Typography variant="h4" sx={{ mt: 1, fontWeight: 800, color: palette.primary }}>
                  {dailyProgress.xpEarned}
                  <Typography component="span" variant="body2" color="text.secondary" sx={{ fontWeight: 700 }}>
                    {' '}/ {dailyProgress.xpTarget} XP
                  </Typography>
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <LinearProgress
                    variant="determinate"
                    value={(dailyProgress.xpEarned / dailyProgress.xpTarget) * 100}
                    aria-label="Daily XP progress"
                  />
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
                  {dailyProgress.wordsSpoken} words spoken today. Complete one more session to
                  finish your goal.
                </Typography>

                <Button
                  fullWidth
                  variant="outlined"
                  endIcon={<ArrowForwardRoundedIcon />}
                  onClick={() => navigate('/topics')}
                  sx={{ mt: 2.5 }}
                >
                  Browse topics
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}
